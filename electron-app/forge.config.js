const path = require("path");
const fs = require("fs");
const process = require("process");

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
      /^\/src/,
      /^\/coverage/,
      /^\/Mambaforge.sh/,
      /^\/Mambaforge-Windows-x86_64.exe/,
      /^\/postbuild_tests/,
    ],
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
      config: {},
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
          owner: "jsbrittain",
          name: "GRAPEVNE",
        },
        draft: true,
      },
    },
  ],
  hooks: {
    packageAfterCopy: async (
      config,
      buildPath,
      electronVersion,
      platform,
      arch,
    ) => {
      var src = path.join(__dirname, "../nodemapper/dist/");
      var dst = buildPath;
      fs.cpSync(src, dst, { recursive: true });
    },
    /* node-pty python links out-of-module
     * Believed to be a node-gyp issue; this is a workaround which removes the offending
     * files (used for building node-gyp) from the final (electron) build
     * https://stackoverflow.com/questions/73216989/electron-forge-throws-python3-8-links-out-of-the-package-error-when-makin
     */
    packageAfterPrune: async (_config, buildPath) => {
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
