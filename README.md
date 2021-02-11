# Sonatype Nexus IQ Plugin for VS Code

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/sonatypecommunity.vscode-iq-plugin?color=blue&label=VS%20Marketplace&logo=visual-studio-code&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=SonatypeCommunity.vscode-iq-plugin)
<a href="https://circleci.com/gh/sonatype-nexus-community/vscode-iq-plugin"><img src="https://circleci.com/gh/sonatype-nexus-community/vscode-iq-plugin.svg?style=shield" /></a>

Sonatype's VSCode extension allows you to surface and remediate issues in your project's dependencies without ever leaving your development environment.

Any developer can use the extension for free against our publicly available [OSS Index](https://ossindex.sonatype.org/) vulnerability database while our commercial users can connect to [Sonatype's Nexus IQ Server](https://www.sonatype.com/nexus-iq-server) to evaluate against organizational policy. Drill down into all of your dependencies to examine each package version for violations to determine whether you should upgrade or move to a different version at a glance.

## Supported Formats

Good news for polyglots -- the extension allows you to view violations across multiple ecosystems at once across the following formats: 

- npm/yarn (`npm install` or `yarn install` required)
- maven (`pom.xml`)
- Gradle (`build.gradle`)
- python (`requirements.txt` or `poetry.lock`)
- RubyGems (`Gemfile.lock`)
- Golang (`dep` or `go mod`)
- PHP (`composer.lock`)
- Rust/Cargo (`Cargo.lock`)
- R/CRAN (see known quirks)
- Conan (any conan formatted `*.lock` files)

### Sonatype Nexus IQ Scan

![IQ Screenshot](https://github.com/sonatype-nexus-community/vscode-iq-plugin/raw/main/media/iq-screenshot.png)

### OSS Index Scan

![OSSI Screenshot](https://github.com/sonatype-nexus-community/vscode-iq-plugin/raw/main/media/ossi-screenshot.png)

## Installation

- Install from the [marketplace link](https://marketplace.visualstudio.com/items?itemName=SonatypeCommunity.vscode-iq-plugin)
- Install directly from the VSCode extension interface:

![Install Screenshot](https://github.com/sonatype-nexus-community/vscode-iq-plugin/raw/main/media/install-screenshot.png)

## Configuration

Configuration is done in VSCode's extension settings: `Preferences > Settings > Sonatype Explorer`

![VS Code Settings](https://github.com/sonatype-nexus-community/vscode-iq-plugin/raw/main/media/animated-settings.gif)

If you are a commercial Sonatype IQ user, switch the data source to `iqServer` and enter your IQ endpoint and credentials.  You can enter your password which will be stored in cleartext, or you can leave this blank and be prompted for a password on start-up:

![VSCode Settings](https://github.com/sonatype-nexus-community/vscode-iq-plugin/raw/main/media/iqserver-passwordprompt-dark.png)

Additonally, you can create a [user token](https://help.sonatype.com/iqserver/automating/rest-apis/user-token-rest-api---v2) and save this in the password field instead so you are not storing credentials in plain text.

## Themes

The extension supports color theme changes dynamically.

![Theme Screenshot](https://github.com/sonatype-nexus-community/vscode-iq-plugin/raw/main/media/light-theme-screenshot.png)

### Known Quirks

We try to use other tooling whenever possible, to avoid reinventing the wheel (that's what Open Source is about anyways, right!). However, due to using this tooling, we are at the mercy of it, sometimes, so here's a list of quirks we've ran into while developing/using this extension ourself.

#### npm/yarn

- We read the actual dependencies you have installed, which means we parse your node_modules folder. If this folder doesn't exist, we won't find any dependencies! Make sure to run `npm i` or `yarn` on your project if you haven't done so already.

#### RubyGems

- We parse the `Gemfile.lock` file, so if you don't have one, you won't see any dependencies!
- If your `Gemfile.lock` has no specs in it, we will not show any dependencies.

#### Golang

##### go mod

- Golang support depends on an installation of Golang
- We run `go list -m all` to get your dependency list
- This includes test dependencies, so it might be noisy
- It would seem due to this running in VS Code, it runs in a slightly different shell/user, and thus it downloads your dependencies. We set this to `/tmp/gocache` in code, which may not work on Windows (PRs welcome!), so it might be slowish on its first run

##### dep

- We parse the `Gopkg.lock` toml file provided by `dep`
- Some `dep` versions do not use `semver`, so unless you are using a version that looks like `1.0.0` etc... you won't get results from OSS Index or IQ Server
- `dep` support works on Windows/OS X/Linux, as we are not running any OS specific commands

#### R (Cran)

- R support depends on R being available, and your project needs a `.Rbuildignore` file otherwise we cannot determine it's an R project
- This extension also runs an R script to get your installed packages (currently the best way we know of to do this), the way we get these can be seen at `scripts/installed.r` in our GitHub repo
- The way the R script runs, it finds all of the packages you've installed in the R environment, so not just for your project. This is because there is really no way to query for project specific packages, and appears to be a limitation of R.

#### Various and Sundry

- "My project has 3,000 dependencies, why is this so slow?!?". We chunk up requests to OSS Index (free solution) in sections of 128 dependencies, so for 3,000 dependencies, you are making 24 https POST requests for information, and then it's merging those results, etc... We'd love to know your feedback on the tool, so if you do run into this, open up an issue and let us know! Same goes for IQ Server, there could be quite a bit to process.

## Development

Development requires running this project in Visual Studio Code, for ease of testing etc...

You'll need a working version of nodejs (we have been using 12.x and higher), and then:

```
npm install && npm run build
```

Then:

`Debug > Launch Extension`

`Debug > Start Debugging`

More information is written to a log file. You can find the log file by looking in the `Sonatype IQ Extension` channel of the 
`Output` of the vscode instance you launched for debugging. 
![log-file-location](https://github.com/sonatype-nexus-community/vscode-iq-plugin/raw/main/media/log-file-location.png)
 
If you are working on functionality that requires IQ Server, you'll need an instance running, and configured in the settings for the project. OSS Index should work right out of the box.

All of the React specific code can be found in `src`. The rest of the code is contained within `ext-src` and this is what communicates with either OSS Index or IQ Server.

We highly suggest installing "Webview Developer Tools" for this project, as the front end is written in React, and it's nice to have that to see what's going on.

### Contributing to Nexus IQ Plugin for VS Code

#### Adding a format

1) Run `FORMAT=Maven npm run generate-format`, substituting the value for FORMAT for the name of the Format you are working on, example: `Maven` in this case
2) Implement the methods you need to in these newly generated classes, and then in `ext-src/packages/ComponentContainer.ts`, add your Implementation!

## Contributing

We care a lot about making the world a safer place, and that's why we created this extension. If you as well want to speed up the pace of software development by working on this project, jump on in! Before you start work, create a new issue, or comment on an existing issue, to let others know you are!

## Releasing

We use [semantic-release](https://github.com/semantic-release/semantic-release) to generate releases. For example,
to perform a "patch" release, add a commit to main with a comment like:

```
fix: `policyViolations of undefined` when loading a python project with requirements.txt (see Issue #127) 
```

Without such a commit comment, commits to the `main` branch will cause a build failure during the release
process due to an attempt to reuse an existing version number.

To avoid such build failures without performing a release, be sure your commit message includes `[skip ci] `.

## The Fine Print

It is worth noting that this is **NOT SUPPORTED** by Sonatype, and is a contribution of ours
to the open source community (read: you!)

Remember:

- Use this contribution at the risk tolerance that you have
- Do NOT file Sonatype support tickets related to this Visual Studio Code extension in regard to this project
- DO file issues here on GitHub, so that the community can pitch in

Phew, that was easier than I thought. Last but not least of all:

Have fun creating and using this extension and the [Sonatype OSS Index](https://ossindex.sonatype.org/), we are glad to have you here!

## Getting help

Looking to contribute to our code but need some help? There's a few ways to get information:

- Chat with us on [Gitter](https://gitter.im/sonatype/nexus-developers)
