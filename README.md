# Zillow Fiber Finder

This is an extension that will, when you look at a property on zillow, automatically check for Fiber availability.

The first target is Google fiber; later it will also check AT&T and Verizon, if possible.

The results will appear in the details popup that appears when you click on a property.

Being able to search for homes meeting fiber criteria would be nice, but I'm pretty sure that's impossible to implement as an extension.

AT&T note: I stumbled accross this website: https://www.attspoc.com/e/(S(vvxvx3nxizt45gqn0rcetivg))/oe/landing.aspx?transit_id=f82a4231-edcb-4419-886e-2d2e7f821241

Which may be easier to scrape.

There's also https://www.allconnect.com/results/providers?zip=78702

but I don't think they actually verify that plans are availible, it's just what's "in your area". Oh, but maybe they do! Or don't. Just noticed the URL just has a "zip" parameter.

## Fact Finding Mission: Zillow

The popup when you click a property has the id `details-page-container`. The HTML does not load until you click, and is unloaded when you close the popup.

A good place to put the status of fiber would be right up top, under the address. The address is an `<h1>` element with the id `ds-chip-property-address`. No idea what `ds-chip-` refers to, and whether that might change for certain properties.

## Fact Finding Mission: Google Fiber

To search for an address, their website makes a `post` request to `https://fiber.google.com/address/`, with the following form data (with example values)

```
street_address: 3605 Palomar Ln
zip_code: 78727
unit_number:
token: ALQHHn93Dsy4oZTiZHaO_m9HH_9WABBOug:1648755919996
```

--------------------

1210 E 10th St, Austin, TX 78702
1210 East 10th Street    78702

```
<h1 class="cta-title">This address has a different Google Fiber account</h1>
```

If the address is already owned by someone with an account, the page will display "This address has a different Google Fiber account".

---------------------------

```
<div class="ng-star-inserted"><h1 class="cta-title">Google Fiber isn’t available for this address</h1><!----></div>
```
10610 Lanshire Dr #B, Austin, TX 78758

If it's unavailable, it will say "Google Fiber isn’t available for this address".

https://fiber.google.com/address?street_address=3605%20Palomar%20Ln&unit_number=&zip_code=78727&event_category=check%20address&event_action=submit&event_label=hero

---------------------------------

```
<p class="preconfig-title"><span>Nice!</span><span> You’re eligible to get Google Fiber Internet. </span></p>
```
1815 W 36th St #B, Austin, TX 78731

1815 West 36th Street   B   78731
https://fiber.google.com/address?street_address=1815%20West%2036th%20Street&unit_number=B&zip_code=78731&event_category=check%20address&event_action=submit&event_label=hero

If it's available, it'll redirect to and display "Nice! You’re eligible to get Google Fiber Internet."

-------------

there's also a webpass variant, for apartments, This one is tricky because it seems to use client side JS to fetch availability, AND it's broken currently. However, it's easy to notice, because it redirects to https://webpass.net/

## FUCKING JAVASCRIPT 

The text on the pages comes from FUCKING JAVASCRIPT. WHY???

Anyway. With a few minutes of searching I can't find a way to do this from within javascript. There is pupeteer for Node, but it executes headless chrome, so it won't work in a browser extension.

The new plan is to run a webserver on localhost that communicates with the Chrome extension.

Could write it in python. However, Puppeteer does look easy: https://dev.to/princepeterhansen/how-to-scrape-html-from-a-website-built-with-javascript-mjn



## Geocoding

Note that since on Zillow, the address looks like `3605 Palomar Ln, Austin, TX 78727`, I'm going to have to process that into a form Google accepts. Google itself offers the service via it's Geocoding API, but it looks like going with Bing will be less of a hassle.

Bing suggests using the `Find by Query` API for address normalization. Example: `http://dev.virtualearth.net/REST/v1/Locations/3605%20Palomar%20Ln,%20Austin,%20TX%2078727?o=json&key=AlQ63NcmOaFtcmnlx6aQdmigBJ76sWnrwMiwTm5HW3ynbNa8jAtd6JhQz1ZPL45k`

AlQ63NcmOaFtcmnlx6aQdmigBJ76sWnrwMiwTm5HW3ynbNa8jAtd6JhQz1ZPL45k

Use `encodeURI` in javascript to encode the address.

That call will return a response:

https://docs.microsoft.com/en-us/bingmaps/rest-services/common-response-description

`resourceSets[0] -> resources[0]` will be the collection of location objects.

https://docs.microsoft.com/en-us/bingmaps/rest-services/locations/location-data

For parsing the example address, `3605 Palomar Ln, Austin, TX 78727`, I'd access the following fields on the location object:

`address -> addressLine` for `3605 Palomar Ln`, and `address -> postalCode` for the zip code, which is all the Google fiber website needs. Not sure yet about the unit number field, will need to do some testing.

Issue with apartments/duplexes: the Google fiber website requires the unit number, but the Bing maps api doesn't actually parse the unit or apartment number. It's possible that I could parse the response, see if it complained about not having a unit number, and then retry with a "1" or an "A" to see if that works. Or at that point attempt to parse the number out of the address... Duplexes with a letter are probably more common on zillow, since apartments don't advertise specific units.

## Scraping Google Fiber Website With JavaScript

It looks like I can fetch with pure javascript, or at least with the extension version of it.

https://web.dev/introduction-to-fetch/

If I need to use something from an NPM package, like Got or Axios, I would need to set up a bundler. Extension-CLI is a project to simplify that. And I should probably use it anyway.

https://oss.mobilefirst.me/extension-cli/

Got fetch working, just had to slap a bunch of stuff in my manifest that I didn't undertand.

On a response, `.text()` will get all the HTML. We can then use `DOMParser.parseFromString()` to turn it into an `HTMLDocument`.

Okay, I'm testing with a `node.js` script. So far I can access the Bing API (easy) and send a POST to Google Fiber. I'm not getting back the right response, and it looks like that's because of the token.

When a real user goes to the website, they get a token (in cookie form I think, have to check) that is sent with the request. The server validates the token before returning a response.

The token is set via javascript when the submit button is clicked. The javascript in question is massive and minified, but here it is:

```
globalScope.gfApi.gf.xsrfToken&&(this.elToken.value=globalScope.gfApi.gf.xsrfToken
```

When using a breakpoint in the chrome devtools debugger, I was able to see that there is indeed a global object called `gf` with an `xsrfToken` field on it.

Pking around the heapdump, there's a reference to an `xsrf` cookie.

HOLY SHIT

the token is only set if logged in with a google account; otherwise it's blank. Still not working, though.