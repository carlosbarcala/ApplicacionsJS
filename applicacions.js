let sections = {};
let section;
class Section {
    #instance;
    id;
    pageElement;
    constructor() {
        this.#instance = this;
    }
    init() {}
    close(section) {
        let sections = document.querySelectorAll('section');
        sections.forEach( sec => {
            if ( sec.id == section ) {
                sec.remove();
            }
        });
    }
    instance() {
        return this.#instance;
    }
}
class App {
    token;
    autenticated;
    sectionHash;
    static init() {
        window.addEventListener('hashchange', App.manageURL );
        document.querySelector('#menuItemlogout').addEventListener('click', function() {
            App.token(null);
            App.showMenu(false);
            window.location.href = "#login";
        });
        App.check()
    }

    static token(token) {
        let _token;
        if ( token !== undefined ) {
            if ( token == null ) {
                localStorage.removeItem('token')
                _token = null;
            } else 
                _token = localStorage.setItem('token', token);
        } else {
            _token = localStorage.getItem('token');
        }
        return _token;
    }

    static manageURL() {
        App.sectionHash = window.location.hash.substr(1);
        if ( App.sectionHash == "") {
            App.sectionHash = "home";
        }
        if ( App.token() == null ) {
            if ( App.sectionHash != 'login' ) {
                window.location.href = "#login";
                return;
            }
            App.load('login');
        } else {
            if ( App.sectionHash == 'login' ) {
                window.location.href = "#home";
                return;
            }
            App.load(App.sectionHash);
            App.showMenu(true);
        }
    }

    static check( callback ) {
        App.send('app','check',{},(data)=>{
            if ( data.valid ) {
                App.token( data.token );
            } else {
                App.token(null);
            }
            App.manageURL();
        });
    }
    
    static auth(username, password) {
        App.send('app','auth',{ username, password },(data)=>{
            if ( !data.valid )
                alert('Los datos introducidos no son correctos');
            App.token( data.token );
            if (  data.valid)
                window.location.href = "#home";
        });
    }

    static load(sectionId) {

        if ( section ) {
            if (section.onHide )
                section.onHide();
        }

        //detect section exists
        if ( sections[sectionId] ) {
            section = sections[sectionId];
            App.show(sectionId);
            if (section.onShow )
                section.onShow();
            return;
        }

        //cargar el html
        fetch(`sections/${sectionId}.html`)
            .then(resp => resp.text())
            .then(function(data) {
                let page = document.createElement('section');
                page.id = sectionId;
                let fragment = document.createRange().createContextualFragment(data);
                page.appendChild(fragment);

                // hay que ocultar la seccion anterior si existe
                if ( section )
                    section.pageElement.classList.add('d-none');
            
                document.querySelector('main').appendChild(page);

                // buscar todos los elementos script
                const scripts = page.querySelectorAll('script');
                scripts.forEach( script => {
                    if ( script.src ) {
                        
                    } else {
                        eval( script.textContent);
                    }
                });
                //cuando exista un / se quita y se pone en mayuscula el siguiente caracter
                // si existe una barra baja o guión la siguiente letra tiene que ir en mayuscula
                let _class = sectionId.replace(/[-_\/]/g, ' '); // reemplazar guiones y guiones bajos con espacios
                _class = _class.split(' ') // dividir en array de palabras
                .map(word => word.charAt(0).toUpperCase() + word.substring(1)) // capitalizar cada palabra
                .join(''); // unir palabras capitalizadas
                _class = 'Section' + _class; // anteponer 'Section'
                try {
                    // Intentar evaluar la clase
                    const Clase = eval(_class);
                    section = eval(`new ${_class}()`);
                } catch (error) {
                // nada
                }
                if ( section ) {
                    section.id = sectionId;
                    section.pageElement = page;
                    if ( section.onInit)
                        section.onInit();
                    App.show(sectionId);
                    if ( section.onShow )
                        section.onShow();
                    sections[sectionId] = section
                }

            }.bind(this) )
            .catch(err => console.error(err))

    }

    static show(section) {
        let sections = document.querySelectorAll('main section');
        sections.forEach( sec => {
            if ( sec.id == section ) {
                sec.classList.remove('d-none');
            } else {
                sec.classList.add('d-none');
            }
        });
    }

    static showMenu(show)  {
        let items = document.querySelectorAll('.user-item');
        items.forEach( item => {
            if ( show ) {
                item.classList.remove('d-none');
            } else {
                item.classList.add('d-none');
            }
        });
    }
    
    static send( namespace , action , sendData={} , callback=null, _error=null ) {
        const headers = {
            'Content-Type': 'application/json'
        }
        const params = {
                namespace: namespace ,
                action: action ,
                data: sendData ,
                token: localStorage.getItem('token')
            }
        const options = {
            method: 'POST',
            headers,
            body: JSON.stringify(params)
        }
        fetch('api.php', options)
            .then( function(resp) { 
                return resp.json();
            })
            .then(data => {
                    if ( callback ) 
                        callback(data.data); 
                })
            .catch( function(error ) {
                console.log(error);
                if ( _error ) {
                    _error(error);
                }
            });
    }
}