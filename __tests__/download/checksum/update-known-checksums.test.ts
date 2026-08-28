import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, jest, test } from "@jest/globals";

const mockDownloadTool = jest.fn<() => Promise<string>>();

jest.unstable_mockModule("@actions/tool-cache", () => ({
  downloadTool: mockDownloadTool,
}));

const { updateChecksums } = await import(
  "../../../src/download/checksum/update-known-checksums"
);

test("serializes checksum entries as JSON data", async () => {
  const tempDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "ruff-action-checksums-test-"),
  );
  const checksumPath = path.join(tempDirectory, "checksum");
  const outputPath = path.join(tempDirectory, "known-checksums.json");
  const checksum = 'checksum"\\value';
  const platform = 'platform"\n};\ncompromised = true;';
  const downloadUrl = `https://example.com/v1.0.0/ruff-1.0.0-${platform}.tar.gz.sha256`;

  try {
    await fs.writeFile(checksumPath, `${checksum}  ruff.tar.gz`);
    mockDownloadTool.mockResolvedValue(checksumPath);

    await updateChecksums(outputPath, [downloadUrl]);

    const content = await fs.readFile(outputPath, "utf8");
    expect(JSON.parse(content)).toEqual({ [`${platform}-1.0.0`]: checksum });
    expect(content.endsWith("\n")).toBe(true);
  } finally {
    await fs.rm(tempDirectory, { force: true, recursive: true });
  }
});
