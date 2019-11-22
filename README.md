# Sonatype Nexus IQ Plugin for VS Code
Scan your libraries against either the free [OSS Index](https://ossindex.sonatype.org/) vulnerability database or the [Sonatype Nexus IQ Server](https://www.sonatype.com/nexus-iq-server). Drill down into all of your dependencies to examine each package version for security vulnerabilities. With IQ Server, it also provides policy and license details.[](https://github.com/sonatype-nexus-community/vscode-iq-plugin)

## Features

* Scan npm, Maven, Go or PyPi projects
* See all components with vulnerable components highlighted

## ![1574377213618](media/ossindex-scan-dark.png)

* OSS Index Component Details

![1574377423550](media/ossindex=lodash-componentinfo-dark.png)

* OSS Index Security Details

![1574377522418](media/ossindex-lodash-security-dark.png)

* IQ Server Component Info with version graph

![1574377675885](media/iqserver-lodash-componentinfo-dark.png)

* IQ Server Policy Info

![1574377830232](media/iqserver-lodash-policy-dark.png)

* IQ Server Security

![1574377984965](media/iqserver-lodash-security-dark.png)

* IQ Server License browser

![1574378068914](media/iqserver-lodash-licensing-dark.png)




## Requirements
To enable the IQ Scan, you will need a Sonatype Nexus IQ Lifecycle License but the OSS Index scan will work for all users.


## Extension Settings
* Configuration is done in the VSCode `Preferences > Settings > Sonatype Explorer`
 
![VSCode Settings](media/Settings.png)

If you are using IQ Server, you can enter your password which will be stored in cleartext, or for additional security you can leave this blank and whenever you start VS Code (and if you have the Nexus Explorer Data Source set to `iqServer`) you will be prompted for a password:

![VSCode Settings](media/iqserver-passwordprompt-dark.png)

If you are using IQ Server v76 or above, you can create a [user token](https://help.sonatype.com/iqserver/automating/rest-apis/user-token-rest-api---v2) and save this in the password field instead. The added benefit of doing this is that you are not storing your IQ Server password in plaintext, and rather a user token that can be deleted, etc... if need be.


