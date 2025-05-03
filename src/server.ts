import express from 'express';
import { EGS, EGSUnitInfo } from './zatca/egs';
import { ZATCASimplifiedTaxInvoice } from './zatca/ZATCASimplifiedTaxInvoice';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // for POST support

// GET endpoint to generate keys and issue cert
app.get('/api/generate', async (req, res) => {
  try {
    const egsunit: EGSUnitInfo = {
      uuid: req.query.uuid as string,
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
    await egs.generateNewKeysAndCSR(false, 'Multi-Techno');
    const compliance_request_id = await egs.issueComplianceCertificate('123345');

    res.json({
      status: 'OK',
      compliance_request_id,
      certificate: egs.get().compliance_certificate,
      private_key: egs.get().compliance_api_secret,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? err });
  }
});

app.listen(port, () => {
  console.log(`API Server running at http://localhost:${port}`);
});
