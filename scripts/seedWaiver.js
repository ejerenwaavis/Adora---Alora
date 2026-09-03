const mongoose = require('mongoose');
const WaiverVersion = require('../models/WaiverVersion');
const Setting = require('../models/Setting');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aora-house';

const waiverContentHtml = `
<div class="waiver-document" style="font-family: inherit; line-height: 1.7; color: #2B2015;">
  <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #E3D3B8; padding-bottom: 16px;">
    <h2 style="font-family: 'Fraunces', serif; font-size: 22px; color: #1E1610; margin: 0 0 6px;">AORA HOUSE — MOVEMENT STUDIO</h2>
    <h3 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.12em; color: #C89B4A; margin: 0 0 4px; font-weight: 600;">CLIENT LIABILITY WAIVER &amp; RELEASE</h3>
    <p style="font-size: 13px; color: #9C8770; margin: 0;">Lagos, Nigeria · Version 2026-09</p>
  </div>

  <p style="font-style: italic; font-size: 13px; color: #6E5E4E; background: #FAF6EF; padding: 12px 16px; border-left: 3px solid #C89B4A; border-radius: 4px; margin-bottom: 20px;">
    This waiver is presented electronically. By proceeding with your movement class bookings, you confirm you have read, understood, and agreed to the terms below.
  </p>

  <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 20px; margin-bottom: 8px;">1. General Assumption of Risk and Limitation of Liability</h4>
  <p>
    By completing this waiver (electronically or otherwise proceeding with enrollment), booking classes, attending sessions, events, activities, and/or other programmes at <strong>Aora House</strong> (the "Studio"), whether in-person at the Studio or using the Studio's equipment (the "Equipment"), you hereby acknowledge and agree, on behalf of yourself, your heirs, personal representatives, and/or assigns (collectively "you" and/or "yourself") that:
  </p>
  <ul style="padding-left: 20px; margin-bottom: 14px;">
    <li style="margin-bottom: 8px;">(a) there are certain inherent risks and dangers in the strenuous nature of the Studio's movement programmes, including Reformer Pilates, Lagree, strength training, and group movement classes, created and/or instructed by the Studio and its instructors;</li>
    <li style="margin-bottom: 8px;">(b) you have voluntarily chosen to enrol and participate in an intense physical exercise programme;</li>
    <li style="margin-bottom: 8px;">(c) you understand that Aora House strongly recommends that you consult with a qualified physician prior to commencing any movement or fitness regimen, and you confirm that you are in good physical condition and do not suffer from any known condition that would prevent your safe participation;</li>
    <li style="margin-bottom: 8px;">(d) you have been fully informed of the strenuous nature of this exercise programme and the possibility of adverse physiological occurrences including, but not limited to, abnormal blood pressure, fainting, muscle injury, and/or other physical harm; and</li>
    <li style="margin-bottom: 8px;">(e) you acknowledge and <strong>voluntarily assume all risks</strong> and danger of injury inherent in physical exercise, fitness training, and/or use of the Equipment.</li>
  </ul>
  <p>
    You further release and discharge <strong>Aora House, its founders, owners, directors, employees, instructors, agents, affiliates, successors, and representatives</strong> ("the Releasees") from any loss, damage, or injury arising out of physical exercise, fitness training, and/or use or operation of any fitness Equipment at the Studio. You, on behalf of yourself, your heirs, executors, and agents, agree not to bring any claim against the Releasees for loss, damage, or injury — including claims based on negligence — arising from:
  </p>
  <ul style="padding-left: 20px; margin-bottom: 14px;">
    <li style="margin-bottom: 6px;">(i) your participation in any class, programme, personal training, or instructor-led activity;</li>
    <li style="margin-bottom: 6px;">(ii) the unexpected malfunction of any Equipment; or</li>
    <li style="margin-bottom: 6px;">(iii) any accident, slip, or fall occurring within the Studio premises or adjacent areas.</li>
  </ul>
  <p>
    You agree to follow all instructions given by the Studio, its instructors, and staff regarding physical exercise, use of Equipment, and conduct within the Studio. Failure to comply may result in removal from the class or premises.
  </p>

  <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 20px; margin-bottom: 8px;">2. Health Disclosure</h4>
  <p>
    You confirm that you have disclosed any pre-existing medical conditions, injuries, or physical limitations to Aora House prior to participating in any class. You accept full responsibility for any injury or adverse health event arising from undisclosed conditions.
  </p>

  <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 20px; margin-bottom: 8px;">3. Media &amp; Photography Consent</h4>
  <p>
    Your presence at Aora House constitutes consent to be photographed, filmed, and/or otherwise recorded, and to the use of such recordings for promotional, editorial, and social media purposes by Aora House. If you do not consent to photography, please notify Studio staff on arrival.
  </p>

  <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 20px; margin-bottom: 8px;">4. Intellectual Property</h4>
  <p>
    All movement programmes, class formats, training methodologies, branding, and digital materials created by Aora House are the exclusive property of the Studio. You may not reproduce, distribute, or use any Aora House content for commercial purposes without prior written consent.
  </p>

  <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 20px; margin-bottom: 8px;">5. Indemnification</h4>
  <p>
    You agree to defend, indemnify, and hold harmless the Releasees from any damages, liabilities, losses, or expenses (including legal fees) arising from any breach by you of this Agreement or from any third-party claim connected to your participation in Studio activities.
  </p>

  <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 20px; margin-bottom: 8px;">6. Governing Law &amp; Dispute Resolution</h4>
  <p>
    This Agreement is governed by the laws of the <strong>Federal Republic of Nigeria</strong>. Any dispute arising out of or in connection with this Agreement shall first be referred to mediation. Where mediation fails, disputes shall be resolved by arbitration in accordance with the <strong>Arbitration and Mediation Act 2023 (Nigeria)</strong>, with proceedings held in <strong>Lagos, Nigeria</strong>. The Studio and the member agree to submit to the exclusive jurisdiction of the courts of Lagos State for any matter not resolvable through arbitration.
  </p>

  <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 20px; margin-bottom: 8px;">7. Severability &amp; Entire Agreement</h4>
  <p>
    If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall continue in full force. This Agreement constitutes the entire understanding between Aora House and the member regarding participation in Studio activities and supersedes all prior communications on the subject.
  </p>

  <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 20px; margin-bottom: 8px;">8. Acknowledgement &amp; Electronic Signature</h4>
  <p>
    By checking the confirmation box and submitting this form, you acknowledge that:
  </p>
  <ul style="padding-left: 20px; margin-bottom: 14px;">
    <li style="margin-bottom: 6px;">You have read this waiver carefully and fully understand that it is a <strong>Release of Liability</strong>;</li>
    <li style="margin-bottom: 6px;">You voluntarily agree to release and discharge Aora House and all Releasees from any and all claims arising from your participation;</li>
    <li style="margin-bottom: 6px;">You have made a free and deliberate choice to sign this waiver as a condition of participating in movement classes at Aora House;</li>
    <li style="margin-bottom: 6px;">Your electronic acceptance carries the same legal weight as a handwritten signature under Nigerian law.</li>
  </ul>
</div>
`;

async function seed() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Seed or update WaiverVersion
    const version = '2026-09';
    let waiver = await WaiverVersion.findOne({ version });
    if (!waiver) {
      waiver = new WaiverVersion({
        version,
        title: 'Aora House Movement Studio — Client Liability Waiver & Release (Lagos, Nigeria)',
        content: waiverContentHtml,
        isActive: true,
        publishedAt: new Date()
      });
      await waiver.save();
      console.log(`✓ Created WaiverVersion ${version}`);
    } else {
      waiver.title = 'Aora House Movement Studio — Client Liability Waiver & Release (Lagos, Nigeria)';
      waiver.content = waiverContentHtml;
      waiver.isActive = true;
      await waiver.save();
      console.log(`✓ Updated existing WaiverVersion ${version}`);
    }

    // Ensure all other versions are inactive
    await WaiverVersion.updateMany({ version: { $ne: version } }, { $set: { isActive: false } });

    // 2. Seed Global Settings
    await Setting.findOneAndUpdate(
      { key: 'waiver_current_version' },
      { value: '2026-09', description: 'Must match the Version ID of the active waiver in the Waivers CMS.' },
      { upsert: true, new: true }
    );
    console.log('✓ Seeded setting: waiver_current_version = "2026-09"');

    await Setting.findOneAndUpdate(
      { key: 'waiver_required' },
      { value: true, description: 'If false, the waiver gate is disabled sitewide for testing.' },
      { upsert: true, new: true }
    );
    console.log('✓ Seeded setting: waiver_required = true');

    console.log('\n✓ Liability Waiver system successfully seeded.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
