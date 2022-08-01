# Cookie-manager-and-vertical-tabs-FF-extension
Custom cookie management and a vertical tab sidebar, should be paired with a custom userchrome.css to hide existing tab bar

Cookie management:
Tabs opened outside of a container do not pick up cookies.  This is for basic browsing where cookies are not required for website functionality.
Tabs opened in named containers only support cookies from that single domain.  Named tabs should be used for frequently visited websites where cookies are required for website functionality.  3rd party cookies are not supported by named containers.
Tabs opened in temporary containers support all cookies.  Temporary containers are used for sites which (1st and 3rd party cookies are essential e.g. online shopping).  Temporary containers should be removed after use.  

Tab sidebar:
Replaces the standard horizontal tabs with a vertical tab sidebar.  Tabs are arranged by container and ordered by time created.  The sidebar provides the following functionality:
-Creating new containers
-Creating new tabs in a specified container
-Duplicating tabs a new temporary container
-Duplicating tabs in the current container
-Unloading tabs - useful for controlling memory usage when opening large numbers of tabs
-Toggling tab mute
-Switching tab view
-Closing tabs
The tab bar also displays website favicons, if the tab is loaded and if it is playing music or muted.

Context Menu:
Added right click option to open tab in new temporary container. 

Areas of future development:
-Drag and drop functionality for the tab sidebar
-Cookie guard feature which will prevent incorrect domains from being opened in protected containers
-Keyboard shortcuts for more efficient tab switching
-Unique container fingerprint obfuscation to help prevent fingerprinting scripts tracking activity across containers 
