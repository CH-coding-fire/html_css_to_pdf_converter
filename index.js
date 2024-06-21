const puppeteer = require('puppeteer');
const fs = require("fs-extra");
const hbs = require('handlebars');
const path = require('path');
const { exec } = require('child_process'); // Import child_process

const compile = async function(templateName, data) {
    const filePath = path.join(process.cwd(), 'templates', `${templateName}.hbs`);
    const html = await fs.readFile(filePath,"utf-8"); //why utf-8? it is a buffer.
    return hbs.compile(html)(data);
}

hbs.registerHelper('chart', function(context) {
    return JSON.stringify(context);
});

async function genPDF(testMode) {
    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox'],
            headless: !testMode // If testMode = true, Launch the browser in headed mode
        });
        const page = await browser.newPage();
        // Set HTML content with data
        const content = await compile('shot-list', data);
        await page.setContent(content);
        // Inject CSS file to the page
        const cssFilePath = path.join(process.cwd(), 'templates', 'styles.css');
        const cssContent = await fs.readFile(cssFilePath, 'utf-8');
        await page.addStyleTag({ content: cssContent });
        // Emulate screen media type
        await page.emulateMediaType("screen");

        // Wait for a while to allow you to see the rendered page
        // Generate and config pdf
        if(!testMode){
            console.log("PDF start generating")
            await sleep(3000); //this is intentional... need to wait for the chart animation to finish
            const pdfPath = "mypdf.pdf";
            await page.pdf({
                path: pdfPath,
                format: "A4",
                printBackground: true, // need to print the background
            });
            console.log("PDF generated successfully!");

            // Open the PDF automatically
            if(args.includes('--auto-open')){
                console.log("auto-open mode, going to opening the PDF");
                const openCommand = {
                    darwin: `open ${pdfPath}`, // MacOS
                    win32: `start ${pdfPath}`, // Windows
                    linux: `xdg-open ${pdfPath}` // Linux
                }[process.platform];
                exec(openCommand);
            }

            await browser.close();
            process.exit();
        }
    } catch (e) {
        console.log('ERROR!!!!', e);
    }
}

const args = process.argv.slice(2);
const testMode = args.includes('--test');

genPDF(testMode);


const data = {
    nameOfPdf: "myPDF",
    largestTitleBox: {
        leftText: "リフィニティブ ファンドレポート",
        rightText: "2024年06月06日 18:28 更新"
    },
    title: {
        text: "ＤＷＳ ロシア・ルーブル債券投信（毎月分配型）"
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
        titleText:"Fruit Consumption",
        yAxisTitleText:"Fruit eaten",
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
    }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
