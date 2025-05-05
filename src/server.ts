import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { EGS, EGSUnitInfo } from './zatca/egs';
import { ZATCASimplifiedTaxInvoice } from './zatca/ZATCASimplifiedTaxInvoice';
import { ZATCASimplifiedInvoiceLineItem } from './zatca/templates/simplified_tax_invoice_template';

const app = express();
const port = process.env.PORT || 3000;
const sign_invpoice = /* XML */`<?xml version="1.0" encoding="UTF-8"?><Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
            <ext:ExtensionContent>
                <sig:UBLDocumentSignatures xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2" xmlns:sbc="urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2" xmlns:sig="urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2">
                    <sac:SignatureInformation>
                        <cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>
                        <sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>
                        <ds:Signature Id="signature" xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
                            <ds:SignedInfo>
                                <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2006/12/xml-c14n11"></ds:CanonicalizationMethod>
                                <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"></ds:SignatureMethod>
                                <ds:Reference Id="invoiceSignedData" URI="">
                                    <ds:Transforms>
                                        <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
                                            <ds:XPath>not(//ancestor-or-self::ext:UBLExtensions)</ds:XPath>
                                        </ds:Transform>
                                        <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
                                            <ds:XPath>not(//ancestor-or-self::cac:Signature)</ds:XPath>
                                        </ds:Transform>
                                        <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
                                            <ds:XPath>not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID='QR'])</ds:XPath>
                                        </ds:Transform>
                                        <ds:Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11"></ds:Transform>
                                    </ds:Transforms>
                                    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod>
                                    <ds:DigestValue>YYt/JTGqJYm9GLa4IETelRUm2sOk9EGGNhZ8omLCNNU=</ds:DigestValue>
                                </ds:Reference>
                                <ds:Reference Type="http://www.w3.org/2000/09/xmldsig#SignatureProperties" URI="#xadesSignedProperties">
                                    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod>
                                    <ds:DigestValue>MWI0MGE3MDE4YTQ3ZGQ3NzFhM2IyODU4NDcyZjliMzBiMTY5NWE2NWQyZDRhN2I5ZGU5ZDhlNmRlOWVmN2FmNQ==</ds:DigestValue>
                                </ds:Reference>
                            </ds:SignedInfo>
                            <ds:SignatureValue>MEUCIQCemKCoCrwdOxqcSEazVT1OJQDv04qS00Ekvl62ZpYtlAIgRNORbWn7gjkZSTxhuCe/3mWdKsQP4hEbZQI23srNOJA=</ds:SignatureValue>
                            <ds:KeyInfo>
                                <ds:X509Data>
                                    <ds:X509Certificate>MIICNjCCAdygAwIBAgIGAZafZdRjMAoGCCqGSM49BAMCMBUxEzARBgNVBAMMCmVJbnZvaWNpbmcwHhcNMjUwNTA1MDc0MjQ4WhcNMzAwNTA0MjEwMDAwWjBWMRYwFAYDVQQDDA1FR1MxLTk2OTI4NDEwMRcwFQYDVQQLDA5NeSBCcmFuY2ggTmFtZTEWMBQGA1UECgwNV2VzYW0gQWx6YWhpcjELMAkGA1UEBhMCU0EwVjAQBgcqhkjOPQIBBgUrgQQACgNCAARbomggTiJkRPB/Xc0GNlubV0xwwlCf1RNHzBj8Yi3CV33qDTgy66eP0nAbd5aHC3T77yRgTr2mo9ZXFqUQrAsso4HZMIHWMAwGA1UdEwEB/wQCMAAwgcUGA1UdEQSBvTCBuqSBtzCBtDFNMEsGA1UEBAxEMS1NdWx0aS1UZWNobm98Mi1NVUxUSS1URUNITk98My1jZjVlM2VlYS0zYzM3LTQ5ZTEtOTg0Yi0zNDdjZWQzNjc1ODYxHzAdBgoJkiaJk/IsZAEBDA8zOTk5OTk5OTk5MDAwMDMxDTALBgNVBAwMBDAxMDAxJDAiBgNVBBoMGzAwMDAgS2luZyBGYWhhaGQgc3QsIEtob2JhcjENMAsGA1UEDwwERm9vZDAKBggqhkjOPQQDAgNIADBFAiBBhS588UgkxkgByfDCI28nz8R2FooUMTZ/R1B6O0nG8AIhAM8GaOqDrcC8Kt8/uLbdKJDE2cjb2Zvk5x//ATFhKuk4</ds:X509Certificate>
                                </ds:X509Data>
                            </ds:KeyInfo>
                            <ds:Object>
                            <xades:QualifyingProperties Target="signature" xmlns:xades="http://uri.etsi.org/01903/v1.3.2#">
                                <xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="xadesSignedProperties">
                                    <xades:SignedSignatureProperties>
                                        <xades:SigningTime>2025-05-05T09:38:00Z</xades:SigningTime>
                                        <xades:SigningCertificate>
                                            <xades:Cert>
                                                <xades:CertDigest>
                                                    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod>
                                                    <ds:DigestValue>NzUxOTUzYWFjYmUwYWQwMmY3MTdhYjc1YzgzOWM1OWJlNzBmNjE2NjRkYmE5N2JkZWVmMTY3ZDJjNGY2Y2Q5Nw==</ds:DigestValue>
                                                </xades:CertDigest>
                                                <xades:IssuerSerial>
                                                    <ds:X509IssuerName>CN=eInvoicing</ds:X509IssuerName>
                                                    <ds:X509SerialNumber>1746430973027</ds:X509SerialNumber>
                                                </xades:IssuerSerial>
                                            </xades:Cert>
                                        </xades:SigningCertificate>
                                    </xades:SignedSignatureProperties>
                                </xades:SignedProperties>
                            </xades:QualifyingProperties>
                            </ds:Object>
                        </ds:Signature>
                    </sac:SignatureInformation>
                </sig:UBLDocumentSignatures>
            </ext:ExtensionContent>
        </ext:UBLExtension>
    </ext:UBLExtensions>
    <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
    <cbc:ID>EGS1-886431145-1</cbc:ID>
    <cbc:UUID>cf5e3eea-3c37-49e1-984b-347ced367586</cbc:UUID>
    <cbc:IssueDate>2025-05-02</cbc:IssueDate>
    <cbc:IssueTime>14:40:40</cbc:IssueTime>
    <cbc:InvoiceTypeCode name="0211010">388</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
    <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
    <cac:AdditionalDocumentReference>
        <cbc:ID>ICV</cbc:ID>
        <cbc:UUID>1</cbc:UUID>
    </cac:AdditionalDocumentReference>
    <cac:AdditionalDocumentReference>
        <cbc:ID>PIH</cbc:ID>
        <cac:Attachment>
            <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==</cbc:EmbeddedDocumentBinaryObject>
        </cac:Attachment>
    </cac:AdditionalDocumentReference>
    <cac:AdditionalDocumentReference>
        <cbc:ID>QR</cbc:ID>
        <cac:Attachment>
            <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">AQ1XZXNhbSBBbHphaGlyAg8zOTk5OTk5OTk5MDAwMDMDFDIwMjUtMDUtMDJUMTQ6NDA6NDBaBAYxNTguNjcFBTIwLjY3BixZWXQvSlRHcUpZbTlHTGE0SUVUZWxSVW0yc09rOUVHR05oWjhvbUxDTk5VPQdgTUVVQ0lRQ2VtS0NvQ3J3ZE94cWNTRWF6VlQxT0pRRHYwNHFTMDBFa3ZsNjJacFl0bEFJZ1JOT1JiV243Z2prWlNUeGh1Q2UvM21XZEtzUVA0aEViWlFJMjNzck5PSkE9CFgwVjAQBgcqhkjOPQIBBgUrgQQACgNCAARbomggTiJkRPB/Xc0GNlubV0xwwlCf1RNHzBj8Yi3CV33qDTgy66eP0nAbd5aHC3T77yRgTr2mo9ZXFqUQrAssCUcwRQIgQYUufPFIJMZIAcnwwiNvJ8/EdhaKFDE2f0dQejtJxvACIQDPBmjqg63AvCrfP7i23SiQxNnI29mb5Ocf/wExYSrpOA==</cbc:EmbeddedDocumentBinaryObject>
        </cac:Attachment>
    </cac:AdditionalDocumentReference>
    <cac:Signature>
        <cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>
        <cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod>
    </cac:Signature>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="CRN">454634645645654</cbc:ID>
            </cac:PartyIdentification>
            <cac:PostalAddress>
                <cbc:StreetName>King Fahahd st</cbc:StreetName>
                <cbc:BuildingNumber>0000</cbc:BuildingNumber>
                <cbc:PlotIdentification>0000</cbc:PlotIdentification>
                <cbc:CitySubdivisionName>West</cbc:CitySubdivisionName>
                <cbc:CityName>Khobar</cbc:CityName>
                <cbc:PostalZone>31952</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>SA</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>399999999900003</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>Wesam Alzahir</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyName>
                <cbc:Name>Cash Customer</cbc:Name>
            </cac:PartyName>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">20.67</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="SAR">46.00</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="SAR">6.89</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5305">S</cbc:ID>
                <cbc:Percent>15.00</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5153">VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="SAR">46.00</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="SAR">6.89</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5305">S</cbc:ID>
                <cbc:Percent>15.00</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5153">VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="SAR">46.00</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="SAR">6.89</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5305">S</cbc:ID>
                <cbc:Percent>15.00</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5153">VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">20.67</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="SAR">138.00</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="SAR">138.00</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="SAR">158.67</cbc:TaxInclusiveAmount>
        <cbc:AllowanceTotalAmount currencyID="SAR">0</cbc:AllowanceTotalAmount>
        <cbc:PrepaidAmount currencyID="SAR">0</cbc:PrepaidAmount>
        <cbc:PayableAmount currencyID="SAR">158.67</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    <cac:InvoiceLine>
        <cbc:ID>1</cbc:ID>
        <cbc:InvoicedQuantity unitCode="PCE">5</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="SAR">46.00</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="SAR">6.89</cbc:TaxAmount>
            <cbc:RoundingAmount currencyID="SAR">52.89</cbc:RoundingAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>TEST NAME</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>15.00</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="SAR">10</cbc:PriceAmount>
            <cac:AllowanceCharge>
                <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
                <cbc:AllowanceChargeReason>A discount</cbc:AllowanceChargeReason>
                <cbc:Amount currencyID="SAR">2.00</cbc:Amount>
            </cac:AllowanceCharge>
            <cac:AllowanceCharge>
                <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
                <cbc:AllowanceChargeReason>A second discount</cbc:AllowanceChargeReason>
                <cbc:Amount currencyID="SAR">2.00</cbc:Amount>
            </cac:AllowanceCharge>
        </cac:Price>
    </cac:InvoiceLine>
    <cac:InvoiceLine>
        <cbc:ID>1</cbc:ID>
        <cbc:InvoicedQuantity unitCode="PCE">5</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="SAR">46.00</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="SAR">6.89</cbc:TaxAmount>
            <cbc:RoundingAmount currencyID="SAR">52.89</cbc:RoundingAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>TEST NAME</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>15.00</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="SAR">10</cbc:PriceAmount>
            <cac:AllowanceCharge>
                <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
                <cbc:AllowanceChargeReason>A discount</cbc:AllowanceChargeReason>
                <cbc:Amount currencyID="SAR">2.00</cbc:Amount>
            </cac:AllowanceCharge>
            <cac:AllowanceCharge>
                <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
                <cbc:AllowanceChargeReason>A second discount</cbc:AllowanceChargeReason>
                <cbc:Amount currencyID="SAR">2.00</cbc:Amount>
            </cac:AllowanceCharge>
        </cac:Price>
    </cac:InvoiceLine>
    <cac:InvoiceLine>
        <cbc:ID>1</cbc:ID>
        <cbc:InvoicedQuantity unitCode="PCE">5</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="SAR">46.00</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="SAR">6.89</cbc:TaxAmount>
            <cbc:RoundingAmount currencyID="SAR">52.89</cbc:RoundingAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>TEST NAME</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>15.00</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="SAR">10</cbc:PriceAmount>
            <cac:AllowanceCharge>
                <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
                <cbc:AllowanceChargeReason>A discount</cbc:AllowanceChargeReason>
                <cbc:Amount currencyID="SAR">2.00</cbc:Amount>
            </cac:AllowanceCharge>
            <cac:AllowanceCharge>
                <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
                <cbc:AllowanceChargeReason>A second discount</cbc:AllowanceChargeReason>
                <cbc:Amount currencyID="SAR">2.00</cbc:Amount>
            </cac:AllowanceCharge>
        </cac:Price>
    </cac:InvoiceLine>
</Invoice>`;

app.use(express.json()); // for POST support

// GET endpoint to generate keys and issue cert
app.post('/api/issuecompliancecert', async (req, res) => {
  try {

    // Default Values for Sample  
    //   const egsunit: EGSUnitInfo = {
    //     uuid: "6f4d20e0-6bfe-4a80-9389-7dabe6620f12",
    //     custom_id: "EGS1-886431145",
    //     model: "IOS",
    //     CRN_number: "454634645645654",
    //     VAT_name: "Wesam Alzahir",
    //     VAT_number: "399999999900003",
    //     location: {
    //         city: "Khobar",
    //         city_subdivision: "West",
    //         street: "King Fahahd st",
    //         plot_identification: "0000",
    //         building: "0000",
    //         postal_zone: "31952"
    //     },
    //     branch_name: "My Branch Name",
    //     branch_industry: "Food"
    // };

    console.log('issue compliance certificate request parameters:', req.body);

    const uuid_p = req.body.uuid ? req.body.uuid : uuidv4();
    const is_production_request = req.body.is_production ? req.body.is_production : false;
    const request_otp = req.body.request_otp ? req.body.request_otp : '123345';

    const egsunit: EGSUnitInfo = {
      uuid: uuid_p as string,
      custom_id: req.body.custom_id as string,
      model: req.body.model as string,
      CRN_number: req.body.crn as string,
      VAT_name: req.body.vat_name as string,
      VAT_number: req.body.vat_number as string,
      location: {
        city: req.body.city as string,
        city_subdivision: req.body.subdivision as string,
        street: req.body.street as string,
        plot_identification: req.body.plot as string,
        building: req.body.building as string,
        postal_zone: req.body.postal as string,
      },
      branch_name: req.body.branch_name as string,
      branch_industry: req.body.industry as string,
    };

    const egs = new EGS(egsunit);
    await egs.generateNewKeysAndCSR(Boolean(is_production_request), 'Multi-Techno');
    const compliance_request_id = await egs.issueComplianceCertificate(String(request_otp));

    res.json({
      status: 'OK',
      uuid: uuid_p,
      compliance_request_id,
      private_key: egs.get().private_key,
      csr: egs.get().csr,
      compliance_certificate: egs.get().compliance_certificate,
      compliance_api_secret: egs.get().compliance_api_secret
    });

  } catch (err: any) {
    console.error('API error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
  }
});

//  Issue Product Certificate
app.post('/api/issueproductioncert', async (req, res) => {

  try {
    console.log('issue production certificate request body:', req.body);

    const egsunit: EGSUnitInfo = {
      uuid: req.body.uuid as string,
      custom_id: req.body.custom_id as string,
      model: req.body.model as string,
      CRN_number: req.body.crn as string,
      VAT_name: req.body.vat_name as string,
      VAT_number: req.body.vat_number as string,
      location: {
        city: req.body.city as string,
        city_subdivision: req.body.subdivision as string,
        street: req.body.street as string,
        plot_identification: req.body.plot as string,
        building: req.body.building as string,
        postal_zone: req.body.postal as string,
      },
      branch_name: req.body.branch_name as string,
      branch_industry: req.body.industry as string
    };

    const egs = new EGS(egsunit);

    // Inject cert data into EGS if available
    if (req.body.private_key) {
      egs.set({ private_key: req.body.private_key });
    }

    if (req.body.csr) {
      egs.set({ csr: req.body.csr });
    }

    if (req.body.compliance_certificate) {
      egs.set({ compliance_certificate: req.body.compliance_certificate });
    }

    if (req.body.compliance_api_secret) {
      egs.set({ compliance_api_secret: req.body.compliance_api_secret });
    }
    const compliance_request_id = req.body.compliance_request_id;

    const production_request_id = await egs.issueProductionCertificate(String(compliance_request_id));

    res.json({
      status: 'OK',
      production_request_id: production_request_id,
      production_certificate: egs.get().production_certificate,
      production_api_secret: egs.get().production_api_secret
    });

  } catch (err: any) {
    console.error('API error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
  }

});

//  Sign Invocie
app.post('/api/signinvoice', async (req, res) => {

  try {
    console.log('Sign Invoice request body::', req.body);

    const egsunit: EGSUnitInfo = {
      uuid: req.body.uuid as string,
      custom_id: req.body.custom_id as string,
      model: req.body.model as string,
      CRN_number: req.body.crn as string,
      VAT_name: req.body.vat_name as string,
      VAT_number: req.body.vat_number as string,
      location: {
        city: req.body.city as string,
        city_subdivision: req.body.subdivision as string,
        street: req.body.street as string,
        plot_identification: req.body.plot as string,
        building: req.body.building as string,
        postal_zone: req.body.postal as string,
      },
      branch_name: req.body.branch_name as string,
      branch_industry: req.body.industry as string
    };

    const egs = new EGS(egsunit);

    // Inject cert data into EGS if available
    if (req.body.private_key) {
      egs.set({ private_key: req.body.private_key });
    }

    if (req.body.csr) {
      egs.set({ csr: req.body.csr });
    }

    if (req.body.compliance_certificate) {
      egs.set({ compliance_certificate: req.body.compliance_certificate });
    }

    if (req.body.compliance_api_secret) {
      egs.set({ compliance_api_secret: req.body.compliance_api_secret });
    }

    // Sample line item
    const line_item: ZATCASimplifiedInvoiceLineItem = {
      id: "1",
      name: "TEST NAME",
      quantity: 5,
      tax_exclusive_price: 10,
      VAT_percent: 0.15,
      other_taxes: [],
      discounts: [
        { amount: 2, reason: "A discount" },
        { amount: 2, reason: "A second discount" }
      ]
    };

    // Sample Invoice
    const invoice = new ZATCASimplifiedTaxInvoice({
      props: {
        egs_info: egsunit,
        invoice_counter_number: 1,
        invoice_serial_number: "EGS1-886431145-1",
        issue_date: "2025-05-02",
        issue_time: "14:40:40",
        customer_name: "Cash Customer",
        previous_invoice_hash: "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==",
        line_items: [
          line_item,
          line_item,
          line_item
        ]
      }
    });

    // Sign invoice
    const { signed_invoice_string, invoice_hash, qr } = egs.signInvoice(invoice, false);

    console.log('signed_invoice_string:', signed_invoice_string);

    res.json({
      status: 'OK',
      signed_invoice_string: signed_invoice_string,
      invoice_hash: invoice_hash,
      qr: qr
    });


  } catch (err: any) {
    console.error('API error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
  }
});

app.post('/api/invoicecompliance', async (req, res) => {
  try {
    console.log('invoice compliance body:', req.body);

    const egsunit: EGSUnitInfo = {
      uuid: req.body.uuid as string,
      custom_id: req.body.custom_id as string,
      model: req.body.model as string,
      CRN_number: req.body.crn as string,
      VAT_name: req.body.vat_name as string,
      VAT_number: req.body.vat_number as string,
      location: {
        city: req.body.city as string,
        city_subdivision: req.body.subdivision as string,
        street: req.body.street as string,
        plot_identification: req.body.plot as string,
        building: req.body.building as string,
        postal_zone: req.body.postal as string,
      },
      branch_name: req.body.branch_name as string,
      branch_industry: req.body.industry as string
    };

    const egs = new EGS(egsunit);

    // Inject cert data into EGS if available
    if (req.body.private_key) {
      egs.set({ private_key: req.body.private_key });
    }

    if (req.body.csr) {
      egs.set({ csr: req.body.csr });
    }

    if (req.body.compliance_certificate) {
      egs.set({ compliance_certificate: req.body.compliance_certificate });
    }

    if (req.body.compliance_api_secret) {
      egs.set({ compliance_api_secret: req.body.compliance_api_secret });
    }

    // const signed_invoice_string = req.body.signed_invoice_string;
    const invoice_hash = req.body.invoice_hash;

    // Check invoice compliance
    const complience_response = await egs.checkInvoiceCompliance(sign_invpoice, invoice_hash)
    // console.log('complience_response:', complience_response.validationResults );
    // console.log('complience_response:', complience_response.reportingStatus );


    res.json({

      compliance_reporting_status:  '',
      compliance_validation_result: complience_response ? complience_response : ''
      // compliance_reporting_status: '',
      // compliance_validation_result: ''
    });

  } catch (err: any) {
    console.error('API error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`API Server running at http://localhost:${port}`);
});
