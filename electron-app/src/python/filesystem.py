import os
import shutil


def DeleteResults(data) -> dict:
    """Remove the local 'results' folder"""
    dirname = data["content"]
    dirname = f"{dirname}/results"
    shutil.rmtree(dirname)
    return {}


def GetFolderItems(data) -> dict:
    """Get the contents of a folder"""
    dirname = data["content"]

    dirlist = [
        filename
        for filename in os.listdir(dirname)
        if os.path.isdir(os.path.join(dirname, filename))
    ]
    dirlist = [name for name in dirlist if name[0] != "."]
    dirlist.sort()
    isdir = len(dirlist) * [True]

    filelist = [
        filename
        for filename in os.listdir(dirname)
        if not os.path.isdir(os.path.join(dirname, filename))
    ]
    filelist = [name for name in filelist if name[0] != "."]
    filelist.sort()
    isdir.extend(len(filelist) * [False])

    contents = [*dirlist, *filelist]

    contents = [{"name": name, "isdir": isdir} for name, isdir in zip(contents, isdir)]

    js = {"foldername": dirname, "contents": contents}
    return js
