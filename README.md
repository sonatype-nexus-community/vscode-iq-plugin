# vscode-iq-plugin README

This is the README for your extension "vscode-iq-plugin". After writing up a brief description, we recommend including the following sections.

To run:
```
code ./vscode-iq-plugin
```

From within the IDE, to launch a VS Code instance in debug mode
with the extension: `F5`

The plugin will create a new panel in your IDE called "Nexus IQ". It will aitomatically evaluate your components.




## Features
* NexusIQ Panel
<img src="media/NexusIQPanel.png" alt="NexusIQ Panel" width="300"/>

* View Details
<img src="media/ViewDetails.png" alt="View Details" width="300"/>


* Component Info Panel
<img src="media/ComponentInfoPanel.png" alt="Component Info Panel" width="300"/>
* Security List
<img src="media/SecurityList.png" alt="Security List" width="300"/>

* Security Detail
<img src="media/SecurityDetail.png" alt="Security Detail" width="300"/>

* Remediation
<img src="media/Remediation.png" alt="Remediation" width="300"/>

* Licensing
<img src="media/Licensing.png" alt="Licensing" width="300"/>

* License Detail
<img src="media/LicenseLink.png" alt="LicenseLink" width="300"/>


## Requirements

Follow the instructions above on how to debug the extension

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `nexusiq.npm.url`: URL including port of the Nexus IQ server
* `nexusiq.npm.username`: Your Nexus IQ user name
* `nexusiq.npm.password`: Your Nexus IQ Internal ApplicationId
* `nexusiq.npm.applicationId`: Your Nexus IQ Internal ApplicationId
* `nexusiq.npm.applicationPublicId`: Your Nexus IQ Application Public Id

## Known Issues
* You have to specify the Application Public Id and Application Internal UUID, this is a pain. I will create a GUI for this when I get to it. For now you have to work out your UUID. The Sonatype Online Help explains how to do this via the RestAPI.

* Password is stored in plain text
* Styling of the Info panel needs some work

## Release Notes

### 0.0.1

Initial release of NexusIQ VS-Code Extension with GUI
  