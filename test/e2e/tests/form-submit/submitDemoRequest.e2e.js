import { Selector } from 'testcafe';
import config from '../../config.cfg';
import libs from '../../libs.cfg';
import Home from '../../poms/pages/home.po';
import RequestDemoModal from '../../poms/forms/demo-modal.po';

fixture`Check "Request a Demo" form submit`
  .page`${config.www_base_host}`
 
  .beforeEach(async t => {
    await t
      .resizeWindow(1280, 600);  
  });

test('Check user can submit "Request a demo" form with valid email address', async t => {
  const home = new Home();
  const requestDemoModal = new RequestDemoModal();

  await t
    .click(home.requestDemoModal, { speed: 0.5 })
    .expect(Selector('#modal').with({
      selectorTimeout: 5000,
      visibilityCheck: true,
    }).visible).ok();

  await t
    .typeText(requestDemoModal.emailField, libs.chance.email())
    .typeText(requestDemoModal.nameField, libs.chance.name())
    .click(requestDemoModal.submitButton, { speed: 0.5 });

  await t
    .expect(Selector(requestDemoModal.responseText).with({
      selectorTimeout: 5000,
      visibilityCheck: true,
    }).visible).ok()
    .expect(Selector(requestDemoModal.responseText).innerText).contains('Thank you for the interest in AdTechMedia WordPress Plugin');
});
