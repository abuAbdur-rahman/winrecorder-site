import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ASSET_KINDS,
  HttpError,
  MAX_INSTALLER_BYTES,
  ReleaseInputSchema,
  errorResponse,
  getReleasePublishDecision,
  parseAssetFileName,
  parseJsonBody,
  validateAssetBody,
  validateAssetSize,
  validateReleaseAssetMetadata,
  type Release,
} from "../lib/release";

const signature = Buffer.from(
  [
    "untrusted comment: signature from tauri secret key",
    "signature-bytes",
    "trusted comment: timestamp:1\tfile:WinRecorder.nsis.zip",
    "trusted-signature-bytes",
    "",
  ].join("\n"),
).toString("base64");

const release: Release = {
  version: "2.0.0-alpha.6",
  notes: "Current release",
  pubDate: "2026-11-19T11:28:59.000Z",
  installer: {
    name: "WinRecorder_2.0.0-alpha.6_x64-setup.exe",
    size: 2_576_253,
    url: "https://example.public.blob.vercel-storage.com/release/WinRecorder_2.0.0-alpha.6_x64-setup.exe",
  },
  updater: {
    name: "WinRecorder_2.0.0-alpha.6_x64-setup.nsis.zip",
    size: 2_557_045,
    url: "https://example.public.blob.vercel-storage.com/release/WinRecorder_2.0.0-alpha.6_x64-setup.nsis.zip",
    signature,
  },
};

describe("release payload validation", () => {
  it("accepts standards-compliant SemVer with build metadata", () => {
    const version = "2.0.0-alpha.7+ci.42";
    const result = ReleaseInputSchema.safeParse({
      ...release,
      version,
      installer: {
        ...release.installer,
        name: `WinRecorder_${version}_x64-setup.exe`,
        url: `https://example.public.blob.vercel-storage.com/release/WinRecorder_${version}_x64-setup.exe`,
      },
      updater: {
        ...release.updater,
        name: `WinRecorder_${version}_x64-setup.nsis.zip`,
        url: `https://example.public.blob.vercel-storage.com/release/WinRecorder_${version}_x64-setup.nsis.zip`,
      },
    });

    assert.equal(result.success, true);
  });

  it("rejects malformed SemVer accepted by the old regex", () => {
    for (const version of ["01.2.3", "1.2.3-alpha..1"]) {
      const result = ReleaseInputSchema.safeParse({ ...release, version });
      assert.equal(result.success, false, version);
    }
  });

  it("rejects a malformed updater signature", () => {
    const result = ReleaseInputSchema.safeParse({
      ...release,
      updater: { ...release.updater, signature: "not base64" },
    });

    assert.equal(result.success, false);
  });

  it("binds asset names to the release version", () => {
    const result = ReleaseInputSchema.safeParse({
      ...release,
      version: "2.0.0-alpha.7",
    });

    assert.equal(result.success, false);
  });
});

describe("release publication policy", () => {
  it("rejects an older release", () => {
    assert.throws(
      () =>
        getReleasePublishDecision(
          { ...release, version: "2.0.0" },
          { ...release, version: "1.9.9" },
          true,
        ),
      (error: unknown) =>
        error instanceof Error &&
        "status" in error &&
        error.status === 409,
    );
  });

  it("allows a newer prerelease", () => {
    assert.equal(
      getReleasePublishDecision(
        { ...release, version: "2.0.0-alpha.6" },
        { ...release, version: "2.0.0-alpha.7" },
        true,
      ),
      "publish",
    );
  });

  it("treats an identical same-version retry as idempotent", () => {
    assert.equal(getReleasePublishDecision(release, { ...release }, true), "unchanged");
  });

  it("rejects changed artifacts under an existing version", () => {
    assert.throws(() =>
      getReleasePublishDecision(
        release,
        {
          ...release,
          installer: { ...release.installer, size: release.installer.size - 1 },
        },
        true,
      ),
    );
  });

  it("allows the seed release to bootstrap Blob storage", () => {
    assert.equal(getReleasePublishDecision(release, { ...release }, false), "publish");
  });
});

describe("release asset policy", () => {
  it("only accepts installer and updater uploads", () => {
    assert.deepEqual(ASSET_KINDS, ["installer", "updater"]);
  });

  it("requires installers to remain strictly under 3 MB", () => {
    assert.throws(() => validateAssetSize("installer", MAX_INSTALLER_BYTES));
    assert.doesNotThrow(() => validateAssetSize("installer", MAX_INSTALLER_BYTES - 1));
  });

  it("checks executable and ZIP magic bytes", () => {
    assert.doesNotThrow(() =>
      validateAssetBody("installer", Uint8Array.from([0x4d, 0x5a, 0x90, 0x00])),
    );
    assert.doesNotThrow(() =>
      validateAssetBody("updater", Uint8Array.from([0x50, 0x4b, 0x03, 0x04])),
    );
    assert.throws(() =>
      validateAssetBody("installer", Uint8Array.from([0x50, 0x4b, 0x03, 0x04])),
    );
  });

  it("requires exact Blob path, URL, and size metadata", () => {
    const metadata = {
      pathname: `release/${release.installer.name}`,
      size: release.installer.size,
      url: release.installer.url,
    };

    assert.deepEqual(
      validateReleaseAssetMetadata("installer", release.installer, metadata),
      release.installer,
    );
    assert.throws(() =>
      validateReleaseAssetMetadata("installer", release.installer, {
        ...metadata,
        pathname: `other/${release.installer.name}`,
      }),
    );
    assert.throws(() =>
      validateReleaseAssetMetadata("installer", release.installer, {
        ...metadata,
        size: release.installer.size + 1,
      }),
    );
  });

  it("distinguishes missing and malformed file names", () => {
    assert.throws(
      () => parseAssetFileName(null),
      (error: unknown) => error instanceof HttpError && error.message.includes("required"),
    );
    assert.throws(
      () => parseAssetFileName("bad name.exe"),
      (error: unknown) => error instanceof HttpError && error.message.includes("Invalid"),
    );
    assert.equal(parseAssetFileName("folder/WinRecorder.exe"), "WinRecorder.exe");
  });
});

describe("release request boundaries", () => {
  it("returns 400 for malformed JSON", async () => {
    const request = new Request("http://localhost/api/release", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    let error: unknown;

    try {
      await parseJsonBody(request);
      assert.fail("Malformed JSON should throw");
    } catch (caught) {
      error = caught;
    }

    const response = errorResponse(error);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Invalid JSON body" });
  });
});
