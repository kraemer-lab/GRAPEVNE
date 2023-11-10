# What is GRAPEVNE?

GRAPEVNE is a desktop application that provides an interactive graphical environment for designing and building hierarchical analytic workflows.

Within the GRAPEVNE environment users can either create new modules from scratch or import existing ones from local or remote repositories using a straightforward drag-and-drop system. The resulting workflow is then visualised as a graph model, representing the dependencies and relationships between the constituent modules and the sequential order in which they are to be executed. The hierarchical modular design means that individual modules can serve as the building blocks of larger and more complex modules, which can in turn be broken down into smaller sub-modules in a flexible manner.

Once the construction of the target workflow is completed, it can be run either locally within GRAPEVNE, or exported with container technology for execution on any platform. The users also have the option to upload the workflow as a stand-alone module either to their own private workspaces (such as a lab group or departmental repository) or a public repository, making it accessible to the broader public and scientific community to utilise in their own workflows.

With GRAPEVNE, our aim is to create a dynamic, user-driven ecosystem where users can easily share and reuse modules and packages that have been developed by themselves or contributed by others. Through the ecosystem, users will be able to better monitor and track the development of new modules that are relevant to their work (potentially through automated suggestions according to the type of analyses that the user is working with). Our hope is that this will help address the issue of the lack of standardisation, especially in fast-evolving fields like epidemiology, where the adoption of standard method protocols and data formats is far outpaced by the development of new analytical methods and data collection procedures. This disconnect leads to the issue of duplicated efforts and a lack of reproducibility and comparability among research results produced by independent research groups - a problem that became particularly prevalent during the COVID-19 pandemic.

# What problems might GRAPEVNE be useful for?

While initially motivated by the need to streamline the analysis of large genomic datasets (>100K sequences) [link to brief introduction of phylogenetics] and to accelerate outbreak analytics, the design of GRAPEVNE is such that it can be used as a part of the solution for any problems involving multiple sequential steps and processes, irrespective of the nature of analysis and data types. The applicability of GRAPEVNE is (at least currently) only constrained by the requirement that any analysis that the users would like to incorporate must be callable within the Snakemake framework.

Here is a list of potential use cases for GRAPEVNE and links to relevant documented examples:

- ETL (Extract, Transform, Load) and data cleaning
- Real-time phylogenetic trees estimation (continuous deployment as new data becomes available)
- Large-scale phylogeographic reconstruction
- Statistical analysis and mathematical modelling
- Distributed analysis (tackling the issue of local data protection and privacy regulations)
- Templating research projects

# Features under development

See our [GRAPEVNE Roadmap](https://github.com/orgs/kraemer-lab/projects/1) for development priorities.

# How to contribute?

GRAPEVNE is an open source project that is under active development. We welcome contributions from everyone in the community, whether you are an experienced software developer or a student who would like to propose new features to GRAVENE for your own research projects. You can begin by exploring our [GitHub repository](https://github.com/kraemer-lab/GRAPEVNE) where you will find our project code, issues, discussions, and more. Here are some ways you can contribute:

## Writing new modules

GRAPEVNE allows users to connect a diverse range of modules together in order to expedite workflow construction. This relies on a user-driven eco-system of modules that are (generally) made available to the community. As such we always welcome new module contributions to the community. First, you should write and test your modules by following the guidelines outlined in our [documentation](https://grapevne.readthedocs.io/en/latest/). If you wish to keep the module private, then you can simply host it internally within your organisation, or on your computer, and direct GRAPEVNE to your module repository for local use. If you wish to make your module available to the broader community then we maintain a list of repositories that users can subscribe to when building their workflows. Registering your repository with us will allow you to maintain your own organisational repository while making your modules available for others to use.

## Requesting features

If there is a new feature that you think GRAPEVNE could benefit from, we ask that you open a [Discussion](https://github.com/kraemer-lab/GRAPEVNE/discussions) on the [GRAPEVNE github repository](https://github.com/kraemer-lab/GRAPEVNE). This discussion may cover suitability, scope, or implementation details. Once it is agreed that the feature is suitable for the main GRAPEVNE codebase (as opposed to a module contribution) you can open a new [Issue](https://github.com/kraemer-lab/GRAPEVNE/issues) requesting the feature. If you are able to contribute the feature yourself, then see our guide on ‘Contributing to the GRAPEVNE codebase’.

## Reporting bugs

If you find a bug in GRAPEVNE then this is a great opportunity to contribute to the community by making us aware of it! First, check the [Issues](https://github.com/kraemer-lab/GRAPEVNE/issues) page on the [GRAPEVNE github repository](https://github.com/kraemer-lab/GRAPEVNE) to see whether the bug has already been reported. If it has, feel free to upvote or bump the issue to raise our awareness of the problem. If there is no relevant Issue then we welcome new Issues reporting bugs. Please follow the template provided (when you open the Issue) to help our team identify and isolate the bug effectively.

## Contributing to the GRAPEVNE codebase

[GRAPEVNE](https://github.com/kraemer-lab/GRAPEVNE) is an [open-source](https://opensource.com/resources/what-open-source) project provided under the permissive [MIT License](https://github.com/kraemer-lab/GRAPEVNE/blob/main/LICENSE). As such we welcome code contributions to our code base, and/or the modification and redistribution of our software. See our [developer guidelines](https://github.com/kraemer-lab/GRAPEVNE/tree/main/dev) for details of our software architecture, instructions on setting up the project as a developer, and contributor guidelines.

## Writing documentation

See our [guidelines for writing and contributing documentation](https://github.com/kraemer-lab/GRAPEVNE/tree/main/docs) for GRAPEVNE.

## Licence Agreement

[GRAPEVNE](https://github.com/kraemer-lab/GRAPEVNE) is provided under the [MIT License](https://github.com/kraemer-lab/GRAPEVNE/blob/main/LICENSE) which permits commercial use, modification, distribution and private use, but is provided without liability or warranty.

## Module contributor licence

Modules written for GRAPEVNE can be distributed with the contributor's choice of licence. Licence files should be bundled with the module and clearly identifiable, preferably as a LICENSE file in the root folder of the module (see our [documentation](https://grapevne.readthedocs.io/en/latest/) for guidelines). Modules made publicly available through the GRAPEVNE core library will typically be distributed under the permissive [MIT License](https://github.com/kraemer-lab/GRAPEVNE/blob/main/LICENSE), which we recommend to encourage reuse, modification and sharing within the GRAPEVNE community.

## How to get in touch?

We welcome discussions, issues, or feature requests. Please submit these through our [GRAPEVNE github repository](https://github.com/kraemer-lab/GRAPEVNE). GRAPEVNE is part of the [Kraemer-lab](https://github.com/kraemer-lab), a research group headed by [Dr Moritz Kraemer](https://www.biology.ox.ac.uk/people/dr-moritz-kraemer).
