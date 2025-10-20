import {readFileSync} from "node:fs";

export default {
  async afterCreate(event) {
    const { result } = event;
    const emails = await strapi.documents('api::email-inbox.email-inbox').findFirst();

    if (!emails || !emails.contactUsInbox) {
      console.log('No email found in Email Inbox');
      return;
    }

    try {
      const template = {
        subject: 'New Contact Us Message from ' + result.name,
        text: readFileSync('./html/contact-us-fallback.txt', 'utf-8'),
        html: readFileSync('./html/contact-us.html', 'utf-8'),
      }
      await strapi.plugin('email').service('email').sendTemplatedEmail({
        to: emails.contactUsInbox,
      }, template, {
        name: result.name,
        email: result.email,
        phone: result.phoneNumber,
        subject: result.subject,
        message: result.message
      })
    } catch (e) {
      console.log(e)
    }
  }
}