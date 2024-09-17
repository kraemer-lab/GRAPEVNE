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

module.exports = {
  packagerConfig: {
    ignore: [
      /^\/\.gitignore$/,
      /^\/\.git$/,
      /^\/\.github$/,
      /^.*\.sh$/,
      /^\/venv/,
      /^\/.venv/,
      /^\/src/,
      /^\/coverage/,
      /^\/Mambaforge.sh/,
      /^\/Mambaforge-Windows-x86_64.exe/,
      /^\/postbuild_tests/,
    ],
    extraResource: [
      './resources/grapevne_helper.py',
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
