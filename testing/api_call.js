"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var openai_1 = require("openai");
//
// Step 1: Obtain an OAuth token
//
var USERNAME = process.env.EQUIFAX_CLIENT_ID;
var PASSWORD = process.env.EQUIFAX_CLIENT_SECRET;
var TOKEN_URL = "https://api.sandbox.equifax.com/v2/oauth/token";
//
// Step 2: Using the token, obtain a credit report
//
var CREDIT_URL = "https://api.sandbox.equifax.com/business/oneview/consumer-credit/v1/reports/credit-report";
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var credentials, tokenResponse, tokenData, accessToken, consumer, reportResponse, report, githubToken, client, creditReport, summary, completion;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    credentials = Buffer.from("".concat(USERNAME, ":").concat(PASSWORD)).toString("base64");
                    return [4 /*yield*/, fetch(TOKEN_URL, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                                Authorization: "Basic ".concat(credentials),
                            },
                            body: "grant_type=client_credentials",
                        })];
                case 1:
                    tokenResponse = _e.sent();
                    return [4 /*yield*/, tokenResponse.json()];
                case 2:
                    tokenData = _e.sent();
                    accessToken = tokenData.access_token;
                    if (!accessToken) {
                        console.error("Failed to obtain access token:");
                        console.error(JSON.stringify(tokenData, null, 2));
                        process.exit(1);
                    }
                    console.log("Token obtained successfully.");
                    consumer = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "consumer.json"), "utf-8"));
                    return [4 /*yield*/, fetch(CREDIT_URL, {
                            method: "POST",
                            headers: {
                                Authorization: "Bearer ".concat(accessToken),
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(consumer),
                        })];
                case 3:
                    reportResponse = _e.sent();
                    return [4 /*yield*/, reportResponse.json()];
                case 4:
                    report = _e.sent();
                    githubToken = process.env.GITHUB_TOKEN;
                    if (!githubToken) {
                        console.error("GITHUB_TOKEN environment variable is not set.");
                        process.exit(1);
                    }
                    client = new openai_1.default({
                        baseURL: "https://models.inference.ai.azure.com",
                        apiKey: githubToken,
                    });
                    creditReport = (_c = (_b = (_a = report === null || report === void 0 ? void 0 : report.consumers) === null || _a === void 0 ? void 0 : _a.equifaxUSConsumerCreditReport) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : {};
                    summary = {
                        subjectName: creditReport.subjectName,
                        birthDate: creditReport.birthDate,
                        hitCode: creditReport.hitCode,
                        fileSinceDate: creditReport.fileSinceDate,
                        lastActivityDate: creditReport.lastActivityDate,
                        fraudSocialNumAlertCode: creditReport.fraudSocialNumAlertCode,
                        fraudVictimIndicator: creditReport.fraudVictimIndicator,
                        models: creditReport.models,
                        trades: ((_d = creditReport.trades) !== null && _d !== void 0 ? _d : []).map(function (t) { return ({
                            accountDesignator: t.accountDesignator,
                            creditorName: t.creditorName,
                            accountNumber: t.accountNumber,
                            dateOpened: t.dateOpened,
                            dateClosed: t.dateClosed,
                            dateLastPayment: t.dateLastPayment,
                            highCredit: t.highCredit,
                            balance: t.balance,
                            pastDue: t.pastDue,
                            paymentHistory: t.paymentHistory,
                            delinquencies30Days: t.delinquencies30Days,
                            delinquencies60Days: t.delinquencies60Days,
                            delinquencies90to180Days: t.delinquencies90to180Days,
                        }); }),
                        inquiries: creditReport.inquiries,
                        publicRecords: creditReport.publicRecords,
                        collections: creditReport.collections,
                    };
                    return [4 /*yield*/, client.chat.completions.create({
                            model: "gpt-4o",
                            messages: [
                                {
                                    role: "system",
                                    content: "You are a financial analyst. Summarize the following credit report in plain English, highlighting key details such as credit score, account standing, payment history, and any alerts or flags.",
                                },
                                {
                                    role: "user",
                                    content: JSON.stringify(summary),
                                },
                            ],
                        })];
                case 5:
                    completion = _e.sent();
                    console.log("\n--- Credit Report Summary ---\n");
                    console.log(completion.choices[0].message.content);
                    return [2 /*return*/];
            }
        });
    });
}
main();
