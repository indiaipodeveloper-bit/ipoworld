import React from "react";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#f8f8f8] text-gray-700 border-t mt-10">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8 text-sm">
        <div>
          <img
            src="https://www.indiaipo.in/assets/images/indiaipo_logo_r.png"
            alt="India IPO"
            className="h-12 mb-3"
          />

          <p className="mb-4 text-justify">
            IPO World Magazine is your trusted source for everything about
            Initial Public Offerings and capital markets. We deliver clear,
            timely, and insightful updates on public issues, helping investors,
            entrepreneurs, and market enthusiasts stay ahead. With simple
            analysis, expert views, and industry updates, we make IPOs easy to
            understand and accessible for everyone.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
          <p>
            <strong>Corporate Office:</strong> 808, 8<sup>th</sup> Floor,
            D-Mall, Netaji Subhash Place, <br />
            Pitampura, Delhi-110034
          </p>

          <p className="mt-2">
            <strong>Email:</strong> info@indiaipo.in
          </p>
          <p>
            <strong>Mobile:</strong> +91-96509-00280
          </p>
          <p>
            <strong>Phone:</strong> 011-47008280
          </p>
        </div>
      </div>

      <div className="bg-[#2e62ae] text-white text-center py-3 text-sm">
        <a
          href="https://www.indiaipo.in/disclaimer"
          className="mx-2 hover:underline hover:text-orange-500 text-white"
        >
          Disclaimer
        </a>{" "}
        |
        <a
          href="https://www.indiaipo.in/privacypolicy"
          className="mx-2 hover:underline hover:text-orange-500 text-white"
        >
          Privacy & Policy
        </a>{" "}
        |
        <a
          href="https://www.indiaipo.in/terms-and-condition"
          className="mx-2 hover:underline hover:text-orange-500 text-white"
        >
          Terms & Conditions
        </a>
        <p className="mt-1">
          Copyright © 2025 All rights reserved by - IndiaIPO
        </p>
      </div>
    </footer>
  );
}
