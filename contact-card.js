import { portfolio } from './content.js?v=1';

const { identity, contact } = portfolio;
document.querySelector('#card-name').textContent = identity.publicName;
document.querySelector('.card-title').textContent = identity.professionalTitle;
document.querySelector('.card-location').textContent = identity.location;
document.querySelector('.card-statement').textContent = contact.statement;
const address = document.querySelector('.card-email');
address.textContent = contact.email;
address.href = document.querySelector('.card-send').href = 'mailto:' + contact.email;

const closeLink = document.querySelector('.card-close');
function closeCard(event) {
  if (window.opener) {
    event.preventDefault();
    window.close();
  }
}
closeLink.addEventListener('click', closeCard);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLink.click();
});
