from typing import List


class Model:
    class Node:
        module = {
            "url": "",  # Module location (e.g. github url)
        }
        name: str = ""
        url: str = ""
        infolder: str = ""
        outfolder: str = ""

        def __init__(self, name, module):
            self.name = name
            self.module = module

    nodes: List[Node] = []  # List of Node objects
    links: List[List[Node]] = []  # List of ordered two-element lists [from, to]

    def __init__(self):
        ...

    def Build(self):
        for node in self.nodes:
            ...

    def AddNode(self, name, module):
        node = self.Node(name, module)
        node.infolder = self.WrangleName(node.module.name, "in")
        node.outfolder = self.WrangleName(node.module.name, "out")
        self.nodes.append(node)

    def WrangleName(self, basename: str, subname: str):
        name = f"_{basename}"
        if subname:
            name = f"{name}_{subname}"
        offset = 0
        while (
            wrangledName := f"{name}_{hash(name + str(offset)) % (2**63)}"
        ) in self.WrangledNameList():
            offset += 1
        return wrangledName

    def WrangledNameList(self):
        return [n.infolder for n in self.nodes] + [n.outfolder for n in self.nodes]


m = Model()
name = "Sleep"
module = {
    "url": "http...sleep-timer",
}
m.nodes = [
    Model.Node(name + "1", module),
    Model.Node(name + "2", module),
    Model.Node(name + "3", module),
]
m.links = [
    [m.nodes[0], m.nodes[1]],
    [m.nodes[1], m.nodes[2]],
]
