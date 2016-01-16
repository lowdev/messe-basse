var router = document.querySelector('app-router');
router.go('/home');

function openPage(pageId) {
  router.go('/' + pageId);
}