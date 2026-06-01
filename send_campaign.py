from __future__ import print_function
import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
import requests
import base64

configuration = sib_api_v3_sdk.Configuration()
configuration.api_key['api-key'] = os.environ['SENDINBLUE_API_KEY']

api_client = sib_api_v3_sdk.ApiClient(configuration)
smtp_api = sib_api_v3_sdk.TransactionalEmailsApi(api_client)

# Download PDF and encode as base64
pdf_url = "https://raw.githubusercontent.com/likunakereselidze/mindset-x-gec-offer/main/MindsetXGEC%20offer.pdf"
pdf_response = requests.get(pdf_url)
pdf_base64 = base64.b64encode(pdf_response.content).decode('utf-8')
print("PDF downloaded.")

html_content = """<!DOCTYPE html>
<html lang="ka">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MINDSET × GEC — Strategy to Growth</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #2D2D2D; margin: 0; padding: 0; background-color: #F0F2F2;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F0F2F2;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:4px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.1);">

                    <!-- Branding Bar -->
                    <tr>
                        <td bgcolor="#153749" style="background-color:#153749; padding:18px 30px; text-align:center;">
                            <span style="font-weight:900; font-size:16px; color:#ffffff; letter-spacing:3px;">MINDSET &times; GEC</span>
                        </td>
                    </tr>

                    <!-- Hero -->
                    <tr>
                        <td bgcolor="#153749" style="background-color:#153749; background: linear-gradient(135deg, #226263 0%, #153749 100%); padding:50px 35px 45px; text-align:center;">
                            <p style="font-size:11px; margin:0 0 16px 0; text-transform:uppercase; letter-spacing:4px; color:#C8D400; font-weight:700;">Strategy to Growth</p>
                            <p style="font-size:28px; font-weight:900; margin:0 0 8px 0; color:#ffffff; line-height:1.3;">ჩვენ არ ვაბარებთ ანგარიშებს<br><span style="color:#F05324;">ჩვენ მოგვაქვს შედეგი</span></p>
                            <p style="font-size:16px; font-weight:300; margin:14px 0 0; color:rgba(255,255,255,0.85); line-height:1.5;">სტრატეგია. პროცესები. მარკეტინგი.<br>ერთი პარტნიორი. გაზომვადი ზრდა.</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px 35px 30px;">

                            <!-- Pain block -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid #F05324; background:#fafafa; margin-bottom:30px; border-radius:0 4px 4px 0;">
                                <tr>
                                    <td style="padding:16px 20px;">
                                        <p style="margin:0 0 8px; font-size:15px; color:#153749; font-weight:600; line-height:1.5;">— სტრატეგია, რომელიც დოკუმენტში რჩება?</p>
                                        <p style="margin:0 0 8px; font-size:15px; color:#153749; font-weight:600; line-height:1.5;">— გაყიდვები, მარკეტინგი და გუნდები სხვადასხვა მიმართულებით მიდიან?</p>
                                        <p style="margin:0; font-size:15px; color:#153749; font-weight:600; line-height:1.5;">— გეგმები, რომლებიც არასდროს სრულდება?</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Value prop -->
                            <p style="font-size:17px; color:#153749; margin:0 0 28px; line-height:1.7;">
                                <strong style="color:#226263;">MINDSET &times; GEC</strong> — ერთი პარტნიორი, რომელიც ბიზნეს სტრატეგიას, პროცესებს, ბრენდსა და მარკეტინგს ერთ სისტემაში აერთიანებს. კონსულტაციაც და განხორციელებაც — ერთი გუნდისგან.
                            </p>

                            <!-- 3 pillars -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
                                <tr>
                                    <td width="33%" style="padding:14px 8px; text-align:center; vertical-align:top; border-top:3px solid #C8D400;">
                                        <span style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#153749; display:block; margin-bottom:5px;">Strategic Clarity</span>
                                        <span style="font-size:12px; color:#777; line-height:1.4; display:block;">ზუსტად იცით სად მიდიხართ და რატომ</span>
                                    </td>
                                    <td width="33%" style="padding:14px 8px; text-align:center; vertical-align:top; border-top:3px solid #F05324;">
                                        <span style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#153749; display:block; margin-bottom:5px;">Operational Alignment</span>
                                        <span style="font-size:12px; color:#777; line-height:1.4; display:block;">გუნდები და პროცესები მზად არიან შედეგისთვის</span>
                                    </td>
                                    <td width="33%" style="padding:14px 8px; text-align:center; vertical-align:top; border-top:3px solid #C8D400;">
                                        <span style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#153749; display:block; margin-bottom:5px;">Measurable Impact</span>
                                        <span style="font-size:12px; color:#777; line-height:1.4; display:block;">ზრდა, რომლის გაზომვა და გაუმჯობესება შეიძლება</span>
                                    </td>
                                </tr>
                            </table>

                            <!-- Attachment box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                                <tr>
                                    <td bgcolor="#153749" style="background-color:#153749; padding:22px 25px; border-radius:6px;">
                                        <span style="display:block; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#C8D400; margin-bottom:8px; font-weight:700;">მიბმული ფაილი</span>
                                        <p style="margin:0; font-size:14px; color:rgba(255,255,255,0.85); line-height:1.6;">წინამდებარე შეთავაზებაში ნახავთ: ვინ ვართ ჩვენ, რა პრობლემებს ვხსნით, როგორ ვმუშაობთ — და რატომ მუშაობს ეს მიდგომა.</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                                <tr>
                                    <td align="center">
                                        <a href="https://bookings.cloud.microsoft/book/GECBusinessDevelopmentTeam@gec-consulting.com/?ismsaljsauthenabled" style="display:inline-block; background-color:#F05324; color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; letter-spacing:0.5px; padding:16px 36px; border-radius:4px; text-transform:uppercase;">30-წუთიანი შეხვედრის დაჯავშნა</a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td bgcolor="#153749" style="background-color:#153749; padding:30px 35px; text-align:center; font-size:13px; color:rgba(255,255,255,0.6);">
                            <span style="font-weight:700; font-size:14px; color:#ffffff; letter-spacing:1px; display:block; margin-bottom:12px;">MINDSET &times; GEC — Strategy to Growth</span>
                            <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:16px 0;">
                            <a href="https://gecbusiness.com" style="color:#C8D400; text-decoration:none;">gecbusiness.com</a> &nbsp;&nbsp;|&nbsp;&nbsp; <a href="https://minds.ge" style="color:#C8D400; text-decoration:none;">minds.ge</a>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""

email = sib_api_v3_sdk.SendSmtpEmail(
    to=[{"email": "lkereselidze@gecbusiness.com", "name": "Lia Kereselidze"}],
    sender={"name": "Lia Kereselidze", "email": "lkereselidze@gecbusiness.com"},
    subject="Mindset <> GEC",
    html_content=html_content,
    attachment=[{
        "content": pdf_base64,
        "name": "MindsetXGEC offer.pdf"
    }]
)

try:
    smtp_api.send_transac_email(email)
    print("Test email sent to lkereselidze@gecbusiness.com — check your inbox.")
except ApiException as e:
    print(f"Error: {e}")
