# HTML/CSS to PDF Converter
## Overview
**HTML/CSS to PDF Converter** is a simple tool, to create PDF from vanilia HTML and CSS.
## Features
- Convert HTML/CSS to PDF
- Use Handlebars to programmatically inject data in HTML
- Can generate a PDF of multiple pages in one go
- Support images/SVG in PDF
- Support two mode: "default" and "testing on browser" (explained further below)
## Requirements
- Node.js (modern version, tested with v20.11.1)
## Installation
- npm install
## Example
You want to create a pdf of two page. There are several steps: 

Step1: create two .hbs file (defaulted to be in public/templates), with the name, e.g. page1.hbs and page2.hbs.

Step2: create a .css file (defaulted to be in public/templates), with the name, e.g. styles.css.

Step3: Link the file css in the `<head>` of .hbs files, same as normal html/css

Step4: In `server.js` there are few things to must know:
- Change `HBS_FILES_FOR_PDF_GENERATION` according to your need: In this example, it should equal to `["page1", "page2"]` which corresponds to `page1.hbs` and `page2.hbs`,
if later you e.g. have myPage1, myPage2, myPage3, myPage4, then you just change it to `["myPage1", "myPage2", "myPage3, "myPage4"]`
- By default `TEMPLATE_PATH`, `CSS_PATH`, `IMG_PATH` are good, no need to change
- `HBS_FILES_FOR_DEV` is for inspecting the page on browser. Will explain further below

Step5: There are two things you can do:
- Run `node server.js`, the see the logs in terminal, the job is finished when it says "Job finished. Server is terminated" Check the PDF you have generated, by default, it is in `/generatedPDF` directory 
- Run `node server.js <nameOfHBS>` You add the name of HBS file, in this example, let say `page2`, so the command is `node server.js page2. Then, it will not generate PDF, it will just run localhost:3000 for the purpose of inspecting the page in browser. Note that each time, only a single page can be inspected. When you change the content of html/css, remember to refresh the page the see the latest change. (Ideal, it should change automatically when the html/css content change, but I have not implement that)

## Reason for using Express.js server
- It serves as a development and testing tool for the convenience of inspecting the page in browser.   
- It allows the browser of puppeteer fetch images from localhost:3000 as an external site. Note that browser of puppeteer cannot fetch image locally.

