import { Selector } from 'testcafe';
import config from '../../config.cfg';
import libs from '../../libs.cfg';
import ContactForm from '../../poms/forms/contact-form.po';
import sharedFunctions from '../../shared-func';

const contactForm = new ContactForm();

const fix = fixture`Check "Contact" form request submit`
  .page`${config.www_base_host}/contact`;

sharedFunctions.fictureResize(fix);

test('Check "Contact" form request can be submitted by user with valid data', async t => {
  await t
    .expect(sharedFunctions.visible(contactForm.formModal)).ok()
    .typeText(contactForm.nameField, libs.chance.name())
    .pressKey('tab')
    .typeText(contactForm.phoneField, libs.chance.phone())
    .pressKey('tab')
    .typeText(contactForm.emailField, libs.chance.email())
    .pressKey('tab')
    .typeText(contactForm.messageField, libs.chance.word())
    .hover(contactForm.submitButton)
    .click(contactForm.submitButton, { speed: 0.5 });
});