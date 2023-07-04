import puppeteer from "puppeteer";
import axios from "axios";
import cron from "node-cron";

const formLink =
  "https://docs.google.com/forms/d/e/1FAIpQLSer_YcxVpPRMLGDR59x0-qpJ0fzkJUYQ-MAkeAxU8Vlqun9pg/viewform";

// Replace with your Line Notify access token
const lineNotifyAccessToken = "UTwKM8kuw4LMzc76g0FjKlu9MvDTDbrqlEkLokSNcMe";

// cron.schedule("20-30 9 * * 1-5", () => {
//   // Generate a random time between 9:20 AM and 9:30 AM
//   const randomMinutes = Math.floor(Math.random() * 11) + 20;
//   const startTime = `09:${randomMinutes.toString().padStart(2, "0")}`;

//   console.log(`Starting bot at ${startTime}`);

//   // Wait until the specified start time
//   setTimeout(async () => {
//     await fill(formLink, true);
//   }, getMillisecondsUntil(startTime));
// });

// Schedule the bot to run every 1 minute
cron.schedule("* * * * *", () => {
    console.log("Starting bot");
    fill(formLink, true);
  });

fill(formLink, true);

async function fill(formLink, submitForm) {
  let dropdownAnswer = "Choice 1";
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    console.log("Opening form");
    // Opening Form
    await page.goto(formLink, { waitUntil: "networkidle2" });
    const title = await page.$eval("title", (el) => el.textContent);
    console.log("Form opened");
    console.log("Form Title: " + title);
    // Short Answer questions
    const selectors = await page.$$(".docssharedWizToggleLabeledContainer");
    for (let i = 0; i < selectors.length; i++) {
      const text = await page.evaluate(
        (element) => element.textContent,
        selectors[i]
      );
      console.log(`Selector ${i}: ${text}`);
      if (text.includes("นายอภิเชษฐ อัคราพุฒิธราดล")) {
        await selectors[i].click();
        console.log(`Clicked on Selector ${i} ${text}`);
      }
      if (text.includes("9.30-18.00")) {
        await selectors[i].click();
        console.log(`Clicked on Selector ${i} ${text}`);
      }
    }
    // Form Submission
    if (submitForm) {
      await page.waitForTimeout(500);
      const submitButtons = await page.$$(".uArJ5e");
      for (let i = 0; i < submitButtons.length; i++) {
        const text = await page.evaluate(
          (element) => element.textContent,
          submitButtons[i]
        );
        if (text.includes("ส่ง")) {
          await submitButtons[i].click();
          console.log(`Clicked on Selector ${i} ${text}`);
        }
      }
      await page.waitForNavigation();
      const submissionPage = await page.url();
      console.log(submissionPage);
      if (submissionPage.includes("formResponse")) {
        console.log("Form Submitted Successfully");
        sendLineNotification("ล่งเวลาเข้างานสำเร็จ");
      } else {
        console.log("Form Submission Failed");
        sendLineNotification(
          "ผิดพลาด!!! ล่งเวลาเข้างานไม่สำเร็จ submit fail โปรดลลเวลาด้วยตัวเอง"
        );
      }
    }
    await page.close();
    await browser.close();
  } catch (error) {
    console.error(error.message);
    sendLineNotification(
      "ผิดพลาด!!! ล่งเวลาเข้างานไม่สำเร็จ โปรดลลเวลาด้วยตัวเอง"
    );
    sendLineNotification(error.message);
  }
}

async function sendLineNotification(message) {
  try {
    const response = await axios.post(
      "https://notify-api.line.me/api/notify",
      `message=${encodeURIComponent(message)}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${lineNotifyAccessToken}`,
        },
      }
    );
    console.log("Line notification sent:", response.data);
  } catch (error) {
    console.error("Failed to send Line notification:", error.message);
  }
}

// Helper function to calculate the milliseconds until a specific time
function getMillisecondsUntil(time) {
  const now = new Date();
  const targetTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    time.split(":")[0],
    time.split(":")[1]
  );

  let delay = targetTime.getTime() - now.getTime();
  if (delay < 0) {
    // If the target time is in the past, schedule for the next day
    delay += 24 * 60 * 60 * 1000;
  }

  return delay;
}
