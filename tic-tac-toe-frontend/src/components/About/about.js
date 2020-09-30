import React, { useState, useEffect } from "react";
import "./about.css";

function About() {
  return (
    <div class="aboutPage">
      <h1>About Page</h1>
      This prototype emerged out of a cloud computing project trying to create a
      browser based game using cloud services to manage the servers.
      <br />
      You can find the matching GitHub Repository{" "}
      <a href="http://https://github.com/bauernknecht/tic-tac-toe-cloudEdition">
        here
      </a>{" "}
      and the article about my developing impression <a href="http://">here</a>
    </div>
  );
}

export default About;
