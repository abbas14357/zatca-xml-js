import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { EGS, EGSUnitInfo } from './zatca/egs';
import { ZATCASimplifiedTaxInvoice } from './zatca/ZATCASimplifiedTaxInvoice';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // for POST support

// GET endpoint to generate keys and issue cert
app.get('/api/issuecompliancecert', async (req, res) => {
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

  const uuid_p = uuidv4();
  const is_production_request = req.query.is_production ? req.query.is_production : false;
  const request_otp = req.query.request_otp ? req.query.request_otp : '123345'; 

    const egsunit: EGSUnitInfo = {
      uuid: uuid_p,
      custom_id: req.query.custom_id as string,
      model: req.query.model as string,
      CRN_number: req.query.crn as string,
      VAT_name: req.query.vat_name as string,
      VAT_number: req.query.vat_number as string,
      location: {
        city: req.query.city as string,
        city_subdivision: req.query.subdivision as string,
        street: req.query.street as string,
        plot_identification: req.query.plot as string,
        building: req.query.building as string,
        postal_zone: req.query.postal as string,
      },
      branch_name: req.query.branch_name as string,
      branch_industry: req.query.industry as string,
    };

    const egs = new EGS(egsunit);
    await egs.generateNewKeysAndCSR(Boolean(is_production_request) , 'Multi-Techno');
    const compliance_request_id = await egs.issueComplianceCertificate(String(request_otp));
    
    res.json({
      status: 'OK',
      uuid: uuid_p,
      compliance_request_id,
      compliance_certificate: egs.get().compliance_certificate,
      compliance_api_secret: egs.get().compliance_api_secret
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? err });
  }
});

app.listen(port, () => {
  console.log(`API Server running at http://localhost:${port}`);
});
