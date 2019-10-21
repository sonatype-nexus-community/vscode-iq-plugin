# vscode-iq-plugin
To run:
The plugin will create a new panel in your IDE called "Nexus IQ". It will automatically evaluate your components.

Currently it is limited to analyzing NPM projects.

Under the covers it does
1) Looks for a package.json
2) Performs a npm shrinkwrap
3) Submits an evaluation report to NexusIQ for the identified components
4) Creates a new panel called Nexus IQ in your VS Code Explorer.
5) Displays the components in the Nexus IQ PANEL



## Features
* NexusIQ Panel
![NexusIQ Panel](media/NexusIQPanel.png)

* View Details by clicking on the pencil.
![View Details](media/ViewDetails.png)

* Component Info Panel
![Component Info Panel](media/ComponentInfoPanel.png)

* Security List
![Security List](media/SecurityList.png)

* Security Detail
![Security Detail](media/SecurityDetail.png)

* Remediation
![Remediation](media/Remediation.png)

* Licensing
![Licensing](media/Licensing.png)

* License Detail
![LicenseLink](media/LicenseLink.png)


## Requirements
You will need a Sonatype Nexus IQ Lifecycle License to be able to use this extension.


## Extension Settings
* Configuration is done in the VSCode Preferences > Settings
![VSCode Settings](media/Settings.png)

* Filter for NexusIQ and then make your changes
![NexusIQ Settings](media/nexusiq_settings.png)

This extension contributes the following settings, all are required:

* `nexusiq.url`: URL including port of the Nexus IQ server
* `nexusiq.username`: Your Nexus IQ user name
* `nexusiq.password`: Your Nexus IQ Internal ApplicationId
* `nexusiq.applicationPublicId`: Your Nexus IQ Application Public Id

## Known Issues
* You have to specify the Application Public Id and Application Internal UUID, this is a pain. I will create a GUI for this when I get to it. For now you have to work out your UUID. Call this end point to find the UUID - /api/v2/applications.
* Password is stored in plain text
* Styling of the Info panel needs some work

## Adding a format
1) Create a folder under packages by copying maven folder
2) Rename the MavenCoorindate.ts, MavenDependencies.ts and MavenPackage.ts to match your new format e.g. PyPICoordinates.ts
3) Refactor the code in this class to match your format's coordinates
4) Add a push of your implementation to `ComponentContainer.ts` constructor
5) Voila!
