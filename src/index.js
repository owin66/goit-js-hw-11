import { PixabayApi } from './js/API';
import { refs } from './js/refs';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { Loading } from 'notiflix/build/notiflix-loading-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { gallery } from './js/card';

const pixabayApi = new PixabayApi();
let gallerySL = new SimpleLightbox('.gallery a');

const options = {
  root: null,
  rootMargin: '100px',
  threshold: 1.0,
};

let callback = (entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      observer.unobserve(entry.target);
      Loading.pulse();
      pixabayApi.addPage();
      pixabayApi.getPhoto().then(response => {
        const { hits, total } = response.data;

        const markup = gallery(hits);
        refs.gallery.insertAdjacentHTML('beforeend', markup);

        gallerySL.on('show.simplelightbox');
        gallerySL.refresh();

        Loading.remove(1000);

        const ifMore = pixabayApi.hasMorePhotos();
        if (ifMore) {
          const lastImage = document.querySelector('.photo-link:last-child');
          observer.observe(lastImage);
        } else {
          Notify.failure(
            "We're sorry, but you've reached the end of search results."
          );
        }
      });
    }
  });
};

let observer = new IntersectionObserver(callback, options);

Loading.init({
  className: 'notiflix-loading',
  backgroundColor: 'rgba(0,0,0,0.3)',
  svgSize: '200px',
  svgColor: 'black',
});

function onSubmitGetValue(e) {
  e.preventDefault();

  let value = e.currentTarget.elements.searchQuery.value.trim();
  pixabayApi.query = value;

  e.currentTarget.reset();
  pixabayApi.resetPage();
  // refs.loadMoreBtn.classList.add('is-hidden');

  ifNoValue(value);

  pixabayApi
    .getPhoto()
    .then(response => {
      const { hits, total } = response.data;

      checkImages(total);
      Loading.pulse();

      const markup = gallery(hits);
      refs.gallery.innerHTML = markup;

      pixabayApi.allImagesSum(total);
      const ifMore = pixabayApi.hasMorePhotos();

      if (ifMore) {
        const lastImage = document.querySelector('.photo-link:last-child');
        observer.observe(lastImage);
      }

      gallerySL.on('show.simplelightbox');
      gallerySL.refresh();

      alerts(total, value);

      Loading.remove(1000);
    })
    .catch(error => {
      Notify.failure(error.message);
    });
}

function ifNoValue(value) {
  if (!value) {
    Notify.failure('Nothing to search');
    // refs.gallery.innerHTML = '';
    // refs.loadMoreBtn.classList.add('is-hidden');

    return;
  }
}
function checkImages(total) {
  if (!total) {
    Notify.failure(
      'Sorry, there are NO images matching your search query. Please try again.'
    );
    refs.gallery.innerHTML = '';
    // refs.loadMoreBtn.classList.add('is-hidden');
    return;
  }
}

function alerts(total, value) {
  if (total > 40) {
    Notify.success(`We found ${total} images of "${value}".`);
  }

  if (total <= 40) {
    refs.loadMoreBtn.classList.add('is-hidden');
    Notify.warning(
      `Sorry, there are only ${total} images matching your search query.`
    );
  }
}
refs.form.addEventListener('submit', onSubmitGetValue);
