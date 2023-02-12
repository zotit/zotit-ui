import { API_URL, DB } from '../config.js';

async function getRemoteList() {
  let apiResult = [];
  try {
    apiResult = await m.request({
      method: 'GET',
      url: API_URL + '/notes',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('token')
      }
    });
    await DB.open();
    await DB.notes.clear();
    await DB.notes.bulkPut(
      apiResult.map((r) => {
        return {
          id: r.id,
          text: r.text,
          created_at: new Date(r.CreatedAt).toISOString()
        };
      })
    );
    Note.list = apiResult;
    localStorage.setItem('lastSync', +new Date());
  } catch (error) {
    if (error.code && error.code == 401) {
      localStorage.clear();
      m.route.set('/login');
    }
    console.log(error);
    NoteList.error = 'Failed to load notes';
  }
  return apiResult;
}

var Note = {
  isLoading: false,
  list: [],
  loadList: async function (getRemote) {
    let that = this;
    that.isLoading = true;
    m.redraw();
    if (getRemote) {
      await getRemoteList();
    } else if (+new Date() - localStorage.getItem('lastSync') > 360000 * 24) {
      //360000 * 24
      //sync if data older than 1 minute
      await getRemoteList();
    }
    that.isLoading = false;
    try {
      let notes = await DB.notes.orderBy('created_at').reverse().toArray();
      Note.list = notes;
      m.redraw();
    } catch (error) {

    }
  },
  add: function (note) {
    let that = this;
    that.isLoading = true;
    return m
      .request({
        method: 'POST',
        url: API_URL + '/notes',
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token')
        },
        body: note
      })
      .then(async function (result) {
        await DB.notes.add({
          id: result.id,
          text: result.text,
          created_at: new Date(result.CreatedAt).toISOString()
        });
        that.isLoading = false;
        that.list.unshift(result);
      })
      .catch(function (e) {
        if (e.code == 401) {
          localStorage.clear();
          m.route.set('/login');
        }
        that.isLoading = false;
        NoteList.error = 'Failed to create note.';
      });
  },
  udpate: function (note, i) {
    let that = this;
    that.isLoading = true;
    return m
      .request({
        method: 'PUT',
        url: API_URL + '/notes',
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token')
        },
        body: {
          id: note.id,
          text: note.text
        }
      })
      .then(async function (result) {
        await DB.notes.put({
          id: result.id,
          text: result.text,
          created_at: new Date(result.CreatedAt).toISOString()
        });
        that.isLoading = false;
        that.list[i] = {
          id: result.id,
          text: result.text,
          created_at: new Date(result.CreatedAt).toISOString()
        }
      })
      .catch(function (e) {
        if (e.code == 401) {
          localStorage.clear();
          m.route.set('/login');
        }
        that.isLoading = false;
        NoteList.error = 'Failed to update this note';
      });
  },
  delete: function (i) {
    let that = this;
    that.isLoading = true;
    return m
      .request({
        method: 'DELETE',
        url: API_URL + '/notes',
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token')
        },
        body: {
          id: that.list[i].id
        }
      })
      .then(async function (result) {
        that.isLoading = false;
        await DB.notes.delete(Note.list[i].id);
        that.list.splice(i, 1);
      })
      .catch(function (e) {
        if (e.code == 401) {
          localStorage.clear();
          m.route.set('/login');
        }
        that.isLoading = false;
        NoteList.error = 'Failed to delete this note';
      });
  }
};

const NoteList = {
  oninit: function () {
    Note.loadList();
  },
  editing: null,
  error: '',
  add: function (e) {
    if (e.keyCode === 13 && e.target.value && !e.shiftKey) {
      Note.add({
        text: e.target.value
      });
      e.target.value = '';
    }
  },
  update: function (title) {
    if (NoteList.editing != null) {
      NoteList.editing.text = title.trim();
      if (NoteList.editing.text === '') NoteList.destroy(NoteList.editing);
      NoteList.editing = null;
    }
  },
  edit: function (note) {
    NoteList.editing = note;
  },
  focus: function (vnode, note) {
    if (note === NoteList.editing && vnode.dom !== document.activeElement) {
      vnode.dom.value = note.text;
      vnode.dom.focus();
      vnode.dom.selectionStart = vnode.dom.selectionEnd = note.text.length;
    }
  },
  reset: function () {
    NoteList.editing = null;
  },
  save: function (e, i) {
    if ((e.keyCode === 13 || e.type === 'blur') && e.ctrlKey) {
      if (NoteList.editing) {
        NoteList.editing.text = e.target.value;
        Note.udpate(NoteList.editing, i);
      }
    } else if (e.keyCode === 27) NoteList.reset();
    if (NoteList.editing && !e.keyCode) {
      Note.udpate(NoteList.editing, i);
    }
  },
  view: function (vnode) {
    var ui = vnode.state;
    return [
      m('header.header', [
        m('h1', 'ZotIt'),

        m(
          "textarea#new-todo[placeholder='What needs to be copied?'][autofocus]",
          {
            onkeypress: ui.add
          }
        )
      ]),
      m('span.error.ml1', NoteList.error),
      m(
        'section#main',
        { style: { display: Note.list.length > 0 ? '' : 'none' } },
        [
          m(
            'ul#todo-list',
            Note.list.map(function (note, i) {
              return m(
                'li.note-list-item',
                {
                  class: note === NoteList.editing ? 'editing' : ''
                },
                [
                  [
                    m('.view', [
                      m(
                        'label',
                        {
                          ondblclick: function () {
                            NoteList.edit(note);
                          }
                        },
                        note.text
                      ),
                      m('button.destroy', {
                        onclick: function () {
                          Note.delete(i);
                        }
                      }),
                      m(
                        'button.share',
                        {
                          onclick: function () {
                            // state.dispatch('share', [todo]);
                          }
                        },
                        m('i.ion-share')
                      )
                    ]),
                    m('textarea.edit', {
                      onupdate: function (vnode) {
                        ui.focus(vnode, note);
                      },
                      onchange: function (e) {
                        e.preventDefault();
                        NoteList.editing.text = e.currentTarget.value;
                      },
                      onkeyup: function (e) {
                        console.log('keyup');
                        ui.save(e, i);
                      }
                    }),
                    m('i.ion-checkmark.edit-icon', {
                      onclick: function (e) {
                        ui.save(e, i);
                      }
                    })
                  ]
                ]
              );
            })
          )
        ]
      ),
      m(
        'span.ml1',
        Note.list.length == 0 && !NoteList.error ? 'No notes created yet.' : ''
      ),
      m('footer#footer', [
        m('span#todo-count', [
          m('strong', Note.list.length),
          Note.list.length === 1 ? ' item left' : ' items left'
        ]),
        m(
          'button.refresh',
          {
            onclick: function () {
              Note.loadList(true);
            }
          },
          m('i.ion-refresh', {
            class: Note.isLoading ? "rotate" : ""
          })
        ),
        m(
          'button.clear-btn',
          {
            onclick: function () {
              localStorage.clear();
              m.route.set('/login');
            }
          },
          'Logout'
        )
      ])
    ];
  }
};
export default NoteList;
//   m.mount(document.getElementById('todoapp'), NoteList);
