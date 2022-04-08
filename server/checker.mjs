import fs from "fs";
import fetch from "node-fetch";
import jsdom from "jsdom";
const { JSDOM } = jsdom;

import pkg from "./puppet-test.js";
const { getPageHTML } = pkg;

const bing_api = "https://dev.virtualearth.net/REST/v1/Locations";
const api_key = fs.readFileSync("api_key", "utf-8");

/**
 * @param address {string}
 * @param encode {boolean}
 */
function normalize_address(address, encode = true) {
  if (encode) {
    address = encodeURIComponent(address);
  }

  const url = bing_api + "?q=" + address + "&o=json&key=" + api_key;
  console.log(url);
  return fetch(url)
    .then((res) => res.json())
    .then((json) => {
      let address_obj = json["resourceSets"][0]["resources"][0]["address"];
      address_obj["original"] = decodeURIComponent(address);
      return address_obj;
    });
}

function add_unit_number(address) {
  let unit_number = "";

  // for testing
  if (address.unit_number) {
    unit_number = address.unit_number;
  } else {
    // Look for something like #A, #B, etc
    const re = /#(\w),/g;
    let unit_match = [...address.original?.matchAll(re)][0];
    if (unit_match) {
      // extract te capturing group
      unit_number = unit_match[1];
    }
  }

  address.unit_number = unit_number;
  return address;
}

function get_fiber_page(address) {
  const street_address = encodeURI(address["addressLine"]);
  const zipcode = address["postalCode"];
  const unit_number = address.unit_number;

  const fiber_url = "https://fiber.google.com/address?";
  const end_url =
    "&event_category=check%20address&event_action=submit&event_label=hero";

  const url =
    fiber_url +
    "&street_address=" +
    street_address +
    "&unit_number=" +
    unit_number +
    "&zip_code=" +
    zipcode +
    end_url;

  console.log(url);

  return getPageHTML(url);
}

// TODO: figure out response when the unit number is missing
function is_available(html) {
  let msg = html.querySelector(".cta-title")?.innerHTML.trim();
  if (msg) {
    if (
      msg === "Google Fiber isn’t available for this address" ||
      msg === "Google Fiber isn’t available for this area"
    ) {
      return false;
    } else if (msg === "This address has a Google Fiber account") {
      return true;
    } else {
      throw new Error(
        "There was a .cta-title, but we didn't recognize the contents. " +
          "Contents: " +
          msg
      );
    }
  }

  msg = html.querySelector(".preconfig-title")?.innerHTML.trim();
  if (msg) {
    if (
      msg ===
      "<span>Nice!</span><span> You’re eligible to get Google Fiber Internet. </span>"
    ) {
      return true;
    } else {
      throw new Error(
        "There was a .preconfig-title, but we didn't recognize " +
          "the contents. Contents: " +
          msg
      );
    }
  }

  throw new Error("No .cta-title or .preconfig-title found!");
}

const test_address = "1815 W 36th St #B, Austin, TX 78731";
// 1815%20W%2036th%20St%20%23B%2C%20Austin%2C%20TX%2078731

const unavailable_test_address = {
  addressLine: "3605 Palomar Ln",
  postalCode: "78727",
};

const available_test_address = {
  addressLine: "1815 West 36th Street",
  unit_number: "B",
  postalCode: "78731",
};

const different_owner_test_address = {
  addressLine: "1210 East 10th Street",
  unit_number: "",
  postalCode: "78702",
};

function log_and_continue(arg) {
  console.log(arg);
  return arg;
}

// normalize_address(test_address, true)
//   .then(add_unit_number)
//   .then(get_fiber_page)
//   .then(is_available)
//   .then(log_and_continue)
//   .catch(console.log);

export function google_fiber_available(address) {
  return normalize_address(address)
    .then(add_unit_number)
    .then(get_fiber_page)
    .then(is_available)
    .then(log_and_continue)
    .catch(console.log);
}
