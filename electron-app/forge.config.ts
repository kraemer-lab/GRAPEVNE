import * as path from "path";
import * as fs from "fs";
import * as process from "process";

const codesignConfig = () => {
  if (process.platform === "darwin" && process.env.MACOS_CERTIFICATE_NAME) {
    return {
      osxSign: {
        identity: process.env.MACOS_CERTIFICATE_NAME,
      },
      osxNotarize: {
        tool: 'notarytool',
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_APP_PASSWORD,
        teamId: process.env.APPLE_TEAM_ID,
      }
    }
  } else {
    return {};
  }
};

const getPlatformAndArch = () => {
  const platform = process.platform;
  let platformType;
  switch (platform) {
    case 'darwin':
      platformType = 'osx';
      break;
    case 'linux':
      platformType = 'linux';
      break;
    case 'win32':
      platformType = 'win';
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
  const arch = process.arch;
  let archType;
  // Map the arch value to '32', '64', or 'arm64'
  switch (arch) {
    case 'x64':
    case 'ppc64':
    case 'riscv64':
    case 'loong64':
    case 's390x':
      archType = '64'; // 64-bit architectures
      break;
    case 'ia32':
    case 'mips':
    case 'mipsel':
    case 'ppc':
    case 's390':
    case 'arm':
      archType = '32'; // 32-bit architectures
      break;
    case 'arm64':
      archType = 'arm64'; // ARM 64-bit architecture
      break;
    default:
      throw new Error(`Unsupported architecture: ${arch}`);
  }
  return {
    platform,
    archType
  };
}

const pulp_reject = () => {
  const base = 'pulp/solverdir/cbc';
  const { platform, archType } = getPlatformAndArch();
  // linux, osx, win; 32, 64, arm64
  const all_combinations = [
    'linux/32', 'linux/64', 'linux/arm64',
    'osx/32', 'osx/64', 'osx/arm64',
    'win/32', 'win/64', 'win/arm64'
  ].map((x) => `${base}/${x}`);
  const current = `${base}/${platform}/${archType}`;
  return all_combinations.filter((x) => x !== current);
}

module.exports = {
  packagerConfig: {
    ignore: [
      /^\/\.gitignore$/,
      /^\/\.git$/,
      /^\/\.github$/,
      /^.*\.sh$/,
      /^\/venv/,
      /^\/src/,
      /^\/coverage/,
      /^\/Mambaforge.sh/,
      /^\/Mambaforge-Windows-x86_64.exe/,
      /^\/postbuild_tests/,
      // Ignore binaries for other platforms - this was introduced when upgrading pulp
      // which includes binaries for all platforms in their package
      ...pulp_reject()
    ],
    icon: "images/icon",
    ...codesignConfig(),
  },
  rebuildConfig: {},
  makers: [
    // zip distributable of binary
    {
      name: "@electron-forge/maker-zip",
    },

    // Installers
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: "images/icon.png",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {},
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: process.env.REPO_OWNER,
          name: process.env.REPO_NAME,
        },
        draft: true,
      },
    },
  ],
  hooks: {
    packageAfterCopy: async (
      config: any,
      buildPath: string,
    ) => {
      fs.cpSync(
        path.join(__dirname, "../nodemapper/dist/"),
        buildPath,
        { recursive: true }
      );
    },
    /* node-pty python links out-of-module
     * Believed to be a node-gyp issue; this is a workaround which removes the offending
     * files (used for building node-gyp) from the final (electron) build
     * https://stackoverflow.com/questions/73216989/electron-forge-throws-python3-8-links-out-of-the-package-error-when-makin
     */
    packageAfterPrune: async (_config: any, buildPath: string) => {
      const gypPath = path.join(
        buildPath,
        'node_modules',
        'node-pty',
        'build',
        'node_gyp_bins'
      );
      fs.rmSync(gypPath, {recursive: true, force: true});
    }
  },
};
