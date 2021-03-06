import { Selector } from 'testcafe';
import config from '../../config.cfg';
import libs from '../../libs.cfg';
import Header from '../../poms/components/header.po';
import RequestDemoModal from '../../poms/forms/demo-modal.po';
import sharedFunctions from '../../shared-func';

const header = new Header();
const requestDemoModal = new RequestDemoModal();

const fix = fixture`Check valid content is displayed on website header`
  .page`${config.www_base_host}`;

sharedFunctions.fictureResize(fix, 'mobile');

test('Check "Request a demo" form can be submitted on mobile resolution', async t => {
  await t
    .expect(sharedFunctions.visible(header.mobileMenuRequestDemoModal)).ok()
    .click(header.mobileMenuRequestDemoModal);

  await t
    .typeText(requestDemoModal.emailField, libs.chance.email())
    .typeText(requestDemoModal.nameField, libs.chance.name())
    .click(requestDemoModal.submitButton, { speed: 0.5 });

  await t
    .expect(sharedFunctions.visible(requestDemoModal.responseText)).ok()
    .expect(
      Selector(requestDemoModal.responseText).innerText)
      .contains('Thank you for the interest in AdTechMedia WordPress Plugin');
});