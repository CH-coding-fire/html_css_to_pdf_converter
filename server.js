const express = require('express');
const fs = require("fs-extra");
const hbs = require('handlebars');
const path = require('path');
const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');

//CONFIGS THAT YOU PROBABLY NEED TO ADJUST //
//MOST IMPORTANT: need to have EXACT same name as hbs files in /templates folder, also the sequence will determine the page sequence in pdf
const HBS_FILES_FOR_PDF_GENERATION = ["examplePage1", "examplePage2"]
const NO_UNIQUE_FILE_NAME = true
const IS_OMIT_PAPER_HELPER_BORDER_IN_PDF = true
const SLEEP_TIME = 3000 //This 3 seconds is intended to wait for animation/image to load, before capturing the PDF
//CONFIGS THAT YOU PROBABLY NEED TO ADJUST //

const PDF_TARGET_FOLDER_NAME = "generatedPDF"
const TEMPLATE_PATH = path.join(__dirname, 'public/templates');
const CSS_PATH = path.join(TEMPLATE_PATH, 'styles.css');
const IMG_PATH = path.join(__dirname, 'public/img');

const args = process.argv.slice(2);
const HBS_FILES_FOR_DEV = args.find(arg => !arg.startsWith('--'));
const IS_DEV_MODE = args.includes('--dev-mode');

const app = express();
const PORT = IS_DEV_MODE? 3001:3000;

app.use(express.static(TEMPLATE_PATH));
app.use(express.static(IMG_PATH));

const compile = async function(templateName, data) {
    const hbsFilePath = path.join(TEMPLATE_PATH, `${templateName}.hbs`);
    const html = await fs.readFile(hbsFilePath, "utf-8");
    return hbs.compile(html)(data);
}

hbs.registerHelper('chart', function(context) {
    return JSON.stringify(context);
});

app.get('/', async (req, res) => {
    const data = await getData()
    const content = await compile(HBS_FILES_FOR_DEV, data);
    res.send(content);
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (IS_DEV_MODE && HBS_FILES_FOR_DEV) {
        console.log(`Dev mode: ${HBS_FILES_FOR_DEV} will be served in localhost. PDF will NOT be generated as this is devmode. To generate PDF, use "npm run genpdf" `);
    }else{
        genPDF();
    }
});

async function genPDF(){
    try {
        const data = await getData() //This should be getting data from database
        logPDFGenerationMessage(HBS_FILES_FOR_PDF_GENERATION);
        const pdfPaths = [];
        for(const hbsFileName of HBS_FILES_FOR_PDF_GENERATION){
            const browser = await puppeteer.launch({
                args: ['--no-sandbox'],
                headless: true
            });
            const page = await browser.newPage();
            const content = await compile(hbsFileName, data);
            await page.setContent(content);
            const cssContent = await fs.readFile(CSS_PATH, 'utf-8');
            if(IS_OMIT_PAPER_HELPER_BORDER_IN_PDF){
                const modifiedCSSContent = await omitBorderInCSS(cssContent);
                await page.addStyleTag({ content: modifiedCSSContent });
            }else{
                await page.addStyleTag({ content: cssContent });
            }
            await page.emulateMediaType("screen");
            console.log(`Start generating pdf for ${hbsFileName}.hbs, the sleep time is ${SLEEP_TIME} milliseconds`)
            await sleep(SLEEP_TIME); //This is intented to wait for highchart to load all the animation first, before capturing the PDF
            const PDF_FILE_NAME = `${hbsFileName}${getCurrentDateTimeString()}`;
            const PDF_PATH = `./${PDF_TARGET_FOLDER_NAME}/${PDF_FILE_NAME}.pdf`;
            await page.pdf({
                path: PDF_PATH,
                format: "A4",
                printBackground: true,
            });
            pdfPaths.push(PDF_PATH)
            console.log(`PDF ${PDF_FILE_NAME} generated successfully!`);
        }
        if(HBS_FILES_FOR_PDF_GENERATION.length>1){
            console.log("Start combining")
            const combinedFileName = "combinedOutput"
            const outputPath = `./${PDF_TARGET_FOLDER_NAME}/${combinedFileName}${getCurrentDateTimeString()}.pdf`;
            combinePDFs(pdfPaths, outputPath)
                .then(() => {
                    console.log('PDFs combined successfully')
                    server.close(()=>{
                        console.log('Job finished. Server is terminated')
                    })
                })
                .catch(err => console.error('Failed to combine PDFs:', err));

        }else{
            server.close(()=>{
                console.log('Job finished. Server is terminated')
            })
        }

    } catch (e) {
        console.log('ERROR!!!', e);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getCurrentDateTimeString = () => {
    if(NO_UNIQUE_FILE_NAME) return "";
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `_${month}${date}${hours}${minutes}${seconds}`;
};

async function combinePDFs(pdfPaths, outputPath) {
    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    for (const pdfPath of pdfPaths) {
        // Load an existing PDF document
        const existingPdfBytes = fs.readFileSync(pdfPath);
        const existingPdf = await PDFDocument.load(existingPdfBytes);

        // Copy all pages from the existing PDF into the new PDF
        const copiedPages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());

        // Add each page to the new PDF document
        copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    // Serialize the PDF to bytes and write it to the output file
    const pdfBytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, pdfBytes);
}

const omitBorderInCSS = async (cssContent) => {
    console.log("Omitting helper paper border in CSS... To turn this off, set IS_OMIT_PAPER_IN_PDF to false")
    return cssContent.replace(/(--PAPER_BORDER_VISUALIZATION:\s*)([^;]+);/, '--PAPER_BORDER_VISUALIZATION: none;');
};

const logPDFGenerationMessage = (files) => {
    if (files.length > 1) {
        const lastFile = files[files.length - 1];
        const fileString = files.slice(0, -1).join('", "');
        console.log(`Going to combine "${fileString}" and "${lastFile}", into a single PDF. Make sure the file names are correct or it won't work`);
    } else {
        console.log("Please provide at least two hbs files for PDF generation.");
    }
};

async function getData(){
    //Here should be logic about getting data from database
    const mockData= {
        serverURL:`http://localhost:${PORT}`,
        largestTitleBox: {
            leftText: "リフィニティブ ファンドレポート",
            rightText: "2024年06月06日 18:28 更新"
        },
        title: {
            text: "ＤＷＳ ロシア・ルーブル債券投信（毎月分配型)"
        },
        infoLabels: {
            first: {
                label: "【愛称】",
                content: ""
            },
            second: {
                label: "【投資協会コード】",
                content: "34311085"
            },
            third: {
                label: "【投資地域】",
                content: "エマージング"
            },
            fourth: {
                label: "【運用委託会社】",
                content: "ドイチェ・アセット・マネジメント"
            },
            fifth: {
                label: "【投信協会商品分類】",
                content: "追加型/海外/債券"
            },
            sixth: {
                label: "【ファンドカテゴリ】",
                content: "海外債券"
            }
        },
        firstRowBox: {
            leftText: "基準価額情報",
            rightText: "2024/06/05 終値"
        },
        secondRowBox: {
            leftText: "運用方針"
        },
        explainParagraph: "「ＤＷＳ ロシア･ルーブル債券投信･マザーファンド」の受益証券を主要投資対象とする。マザーファンドを通じて、主として、ロシアの国債及び準国債（国が５０％以上の株式を保有している企業が発行する債券）等を主要投資対象とする投資信託証券に投資を行う。実質外貨建資産については、原則として対円での為替ヘッジを行わない。毎月分配を行う。インカム･ゲインの確保と信託財産の中長期的な成長を目指して運用を行う。",
        chart1: {
            titleText: "Fruit Consumption",
            yAxisTitleText: "Fruit eaten",
            categories: ['Apples', 'Bananas', 'Oranges'],
            series: [{
                name: 'Jane',
                data: [1, 0, 4]
            }, {
                name: 'John',
                data: [5, 17, 3]
            }]
        },
        footer:{
            firstParagraph:"© 2019 Refinitiv. All rights reserved. Refinitiv（リフィニティブ）が事前に書面により承認した場合を除き、リフィニティブのコンテンツを再発行や再配布すること（フレーミングまたは類似の方法\n" +
                "による場合を含む）は、明示的に禁止されています。Refinitiv（リフィニティブ）およびRefinitiv（リフィニティブ）のロゴは、リフィニティブ及びその関連会社の登録商標であり、商標となって\n" +
                "います。",
            secondParagraph: "本書に含まれるコンテンツ（「本コンテンツ」）は、投資活動を勧誘又は誘引するものではなく、有価証券の「買い」、「売り」又は「保留」のオファーとして使用されてはなりません。本コン\n" +
                "テンツは、投資助言となる投資、税金、法律等のいかなる助言も提供せず、また、特定の金融の個別銘柄、金融投資あるいは金融商品に関する如何なる推奨もしません。本コンテンツの使用は、\n" +
                "資格ある投資専門家の投資助言にとって代わるものではありません。Refinitiv（リフィニティブ）も、その第三者コンテンツ・プロバイダーも、本コンテンツの正確性、完全性、適時性について保\n" +
                "証せず、本コンテンツの使用、コンテンツのエラー、誤謬、不正確性又はそれらに依拠してなされた行為から生じる一切の結果について、何らの責任も負いません。"
        },
        personalDataOrdinance: "© 2019 Refinitiv. All rights reserved. Refinitiv（リフィニティブ）が事前に書面により承認した場合を除き、リフィニティブのコンテンツを再発行や再配布すること（フレーミン\n" +
            "グまたは類似の方法による場合を含む）は、明示的に禁止されています。Refinitiv（リフィニティブ）およびRefinitiv（リフィニティブ）のロゴは、リフィニティブ及びその関連\n" +
            "会社の登録商標であり、商標となっています。"
    };
    return mockData
}
