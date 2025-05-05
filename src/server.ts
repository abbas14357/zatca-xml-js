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

    console.log('issue compliance certificate request parameters:', req.query);

    const uuid_p = req.query.uuid ? req.query.uuid : uuidv4();
    const is_production_request = req.query.is_production ? req.query.is_production : false;
    const request_otp = req.query.request_otp ? req.query.request_otp : '123345';

    const egsunit: EGSUnitInfo = {
      uuid: uuid_p as string,
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
    res.status(500).json({ error: err.message ?? err });
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

    // for testing
    // const is_production_request = req.body.is_production ? req.body.is_production : false;
    // const request_otp = req.body.request_otp ? req.body.request_otp : '123345';
    // await egs.generateNewKeysAndCSR(Boolean(is_production_request), 'Multi-Techno');
    // const compliance_request_id = await egs.issueComplianceCertificate(String(request_otp));

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

app.listen(port, () => {
  console.log(`API Server running at http://localhost:${port}`);
});
