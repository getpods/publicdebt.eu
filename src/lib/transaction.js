import { mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

export function runScript(root, script, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(root, script)], {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit"
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} failed (${signal ?? code}).`));
    });
  });
}

// Keep the previous output until preparation and all checks have succeeded.
export async function replaceDirectory(root, target, name, prepare) {
  const tempRoot = join(root, ".publicdebt-tmp");
  await mkdir(tempRoot, { recursive: true });
  const lock = join(tempRoot, `${name}.lock`);
  try {
    await mkdir(lock);
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new Error(`${name} is already running, or its lock remains after an interrupted run: ${lock}`);
    }
    throw error;
  }
  let work;
  try {
    work = await mkdtemp(join(tempRoot, `${name}-`));
    const staged = join(work, "result");
    await mkdir(staged);
    await prepare(staged);
    const previous = join(work, "previous");
    let hadPrevious = false;
    try {
      await rename(target, previous);
      hadPrevious = true;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    try {
      await rename(staged, target);
    } catch (error) {
      if (hadPrevious) {
        try {
          await rename(previous, target);
        } catch (rollbackError) {
          // Preserve the backup if restoring it fails.
          const recoveryPath = work;
          work = undefined;
          throw new AggregateError([error, rollbackError], `Restore failed. Previous output remains in ${recoveryPath}`);
        }
      }
      throw error;
    }
  } finally {
    if (work) await rm(work, { recursive: true, force: true });
    await rm(lock, { recursive: true, force: true });
  }
}
