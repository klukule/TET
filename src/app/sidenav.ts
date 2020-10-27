/**
 * Side navigation controller
 */

function OpenNav() {
    document.getElementById("sidenav").style.width = "320px";
    document.getElementById('sidenav-overlay').classList.toggle('hidden', false);
}

function CloseNav() {
    document.getElementById("sidenav").style.width = "0";
    document.getElementById('sidenav-overlay').classList.toggle('hidden', true);
}