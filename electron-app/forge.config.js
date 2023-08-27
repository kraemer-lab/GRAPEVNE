const path = require("path");
const fs = require("fs");

module.exports = {
  packagerConfig: {
    ignore: [
      /^\/\.gitignore$/,
      /^\/\.git$/,
      /^\/\.github$/,
      /^.*\.sh$/,
      /^.*\.zip$/,
      /^build/,
      /^coverage/,
      /^venv/,
      /^Mambaforge/,
    ],
  },
  rebuildConfig: {},
  makers: [
    // zip distributable of binary
    {
      name: "@electron-forge/maker-zip",
    },

    // Installers
    /*{
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
      arch
    ) => {
      var src = path.join(__dirname, "../nodemapper/dist/");
      var dst = buildPath;
      fs.cpSync(src, dst, { recursive: true });
    },
  },
};
