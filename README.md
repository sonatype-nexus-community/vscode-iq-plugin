# Sonatype Nexus IQ Plugin for VS Code

Scan your libraries against either the free [OSS Index](https://ossindex.sonatype.org/) vulnerability database or the [Sonatype Nexus IQ Server](https://www.sonatype.com/nexus-iq-server). Drill down into all of your dependencies to examine each package version for security vulnerabilities. With IQ Server, it also provides policy and license details.[](https://github.com/sonatype-nexus-community/vscode-iq-plugin)

## Features

* Scan npm, Maven, RubyGems, Go or PyPi projects (Go is only supported on Linux or OS/X)
* See all components with vulnerable components highlighted

### Known Quirks

We try and use other tooling whenever possible, to avoid reinventing the wheel (that's what Open Source is about anyways, right!). However due to using this tooling, we are at the mercy of it, sometimes, so here's a list of quirks we've ran into while developing/using this extension ourself.

* Ruby Gems support depends on the installation of ruby, and bundler
  * If your ruby version mismatches what is declared in your Gemfile, bundler will not run properly
  * If you use rbenv, ensure your `.ruby-version` file matches your Gemfile
  * In order for the command we use to get your dependency list to output to succeed, you need to have run `bundle install`, as `bundle show` cannot track down what you use locally otherwise

* Golang support depends on an installation of Golang
  * We run `go mod list -m all` to get your dependency list
  * This includes test dependencies, so it might be noisy
  * It would seem due to this running in VS Code, it runs in a slightly different shell/user, and thus it downloads your dependencies. We set this to `/tmp/gocache` in code, which may not work on Windows (PRs welcome!), so it might be slowish on it's first run

* Projects with both RubyGems and NPM (Gemfile.lock, and package.json), or similar
  * This extension currently picks one format, and scans for it. We haven't built a path to scan multiple project types, but that would be lovely. PRs welcome :)

* "My project has 3,000 dependencies, why is this so slow?!?"
  * We chunk up requests to OSS Index (free solution) in sections of 128 dependencies, so for 3,000 dependencies, you are making 24 https POST requests for information, and then it's merging those results, etc... We'd love to know your feedback on the tool, so if you do run into this, open up an issue and let us know!

### Sonatype Nexus IQ Scan

 ![1574377213618](media/iq-animated-scan.gif)


### OSS Index Scan

![1574377213618](media/ossindex-animated-scan.gif)

### Themes

![1574377213618](media/animated-themes.gif)

## Requirements
* To enable the IQ Scan, you will need a Sonatype Nexus IQ Lifecycle License but the OSS Index scan will work for all users
* The plugin requires npm, golang, maven or python and pip to be installed, depending on which language you are using. It will not install these as a part of the plugin

## Extension Settings
* Configuration is done in the VSCode `Preferences > Settings > Sonatype Explorer`

![VS Code Settings](media/animated-settings.gif)

If you are using IQ Server, you can enter your password which will be stored in cleartext, or for additional security you can leave this blank and whenever you start VS Code (and if you have the Nexus Explorer Data Source set to `iqServer`) you will be prompted for a password:

![VSCode Settings](media/iqserver-passwordprompt-dark.png)

If you are using IQ Server v76 or above, you can create a [user token](https://help.sonatype.com/iqserver/automating/rest-apis/user-token-rest-api---v2) and save this in the password field instead. The added benefit of doing this is that you are not storing your IQ Server password in plaintext, and rather a user token that can be deleted, etc... if need be.

## Outstanding Issues

* GoLang support is only for Linux or OS/X but not for Windows.

