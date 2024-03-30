const path = require("path");
const fs = require("fs");
const process = require("process");

module.exports = {
  packagerConfig: {
    ignore: [
      /^\/\.gitignore$/,
      /^\/\.git$/,
      /^\/\.github$/,
      /^.*\.sh$/,
      /^\/Mambaforge.sh/,
      /^\/Mambaforge-Windows-x86_64.exe/,
      /^\/postbuild_tests/,
    ],
    osxSign: {},
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    },
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
    /*{
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },*/
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "kraemer-lab",
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
  },
};
