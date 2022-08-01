# Cookie-manager-and-vertical-tabs-FF-extension
<p>Custom cookie management and a vertical tab sidebar, should be paired with a custom userchrome.css to hide existing tab bar</p>

<b>Cookie management:</b>
<p>Tabs opened outside of a container do not pick up cookies.  This is for basic browsing where cookies are not required for website functionality.</p>
<p>Tabs opened in named containers only support cookies from that single domain.  Named tabs should be used for frequently visited websites where cookies are required for website functionality.  3rd party cookies are not supported by named containers.</p>
<p>Tabs opened in temporary containers support all cookies.  Temporary containers are used for sites which (1st and 3rd party cookies are essential e.g. online shopping).  Temporary containers should be removed after use.</p>
<br>
<b>Tab sidebar:</b>
<p>Replaces the standard horizontal tabs with a vertical tab sidebar.  Tabs are arranged by container and ordered by time created.  The sidebar provides the following functionality:</p>
<ul>
<li>Creating new containers</li>
<li>Creating new tabs in a specified container</li>
<li>Duplicating tabs a new temporary container</li>
<li>Duplicating tabs in the current container</li>
<li>Unloading tabs - useful for controlling memory usage when opening large numbers of tabs</li>
<li>Toggling tab mute</li>
<li>Switching tab view</li>
<li>Closing tabs</li>
</ul>

<p>The tab bar also displays website favicons, if the tab is loaded and if it is playing music or muted.</p>
<br>
<b>Context Menu:</b>
<p>Added right click option to open tab in new temporary container. </p>
<br>
<b>Areas of future development:</b>
<ul>
<li>Drag and drop functionality for the tab sidebar</li>
<li>Cookie guard feature which will prevent incorrect domains from being opened in protected containers</li>
<li>Keyboard shortcuts for more efficient tab switching</li>
<li>Unique container fingerprint obfuscation to help prevent fingerprinting scripts tracking activity across containers </li>
</ul>
