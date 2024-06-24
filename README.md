# HTML/CSS to PDF Converter
## Overview
**HTML/CSS to PDF Converter** is a simple tool, to create PDF from vanilia HTML and CSS.
## Features
- Convert HTML/CSS to PDF
- Use Handlebars to programmatically inject data in HTML
- Can generate a PDF of multiple pages in one go
- Support images/SVG in PDF
- Support two mode: "genpdf" and "devmode" (explained further below)
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
- Change `HBS_FILES_FOR_PDF_GENERATION` according to your need: In this example, it should equal to `["examplePage1", "examplePage2"]` which corresponds to `page1.hbs` and `page2.hbs`,
if later you e.g. have myPage1, myPage2, myPage3, myPage4, then you just change it to `["examplePage1", "examplePage2", "examplePage3", "examplePage4"]`
- By default `TEMPLATE_PATH`, `CSS_PATH`, `IMG_PATH` are good, no need to change
- `HBS_FILES_FOR_DEV` is for inspecting the page on browser. Will explain further below

Step5: There are two mode you can run:
- normal mode: Run `npm run genpdf`, the see the logs in terminal, the job is finished when it says "Job finished. Server is terminated" Check the PDF you have generated, by default, it is in `/generatedPDF` directory 
- devmode:
  - Run `npm run devmode <name-of-file>` You add the name of HBS file, in this example, let say `examplePage3`, so the command is `node run devmode examplePage3`. Then, it will not generate PDF, it will just run localhost:3000 for the purpose of inspecting the page in browser. Note that each time, only a single page can be inspected.
  - After the above, run `npm run browsersync`, it will open another localhost (default is port 3002), you should development on this, as change in html/css will trigger auto refresh, for convenience of development.

## Reason for using Express.js server
- It serves as a development and testing tool for the convenience of inspecting the page in browser.   
- It allows the browser of puppeteer fetch images from localhost:3000 as an external site. Note that browser of puppeteer cannot fetch image locally.

