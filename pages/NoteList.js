import { API_URL, DB } from '../config.js';

async function getRemoteList(pageNo) {
  let apiResult = [];
  NoteList.error = "";
  try {
    apiResult = await m.request({
      method: 'GET',
      url: API_URL + '/notes?page=' + pageNo,
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('token')
      }
    });
    if (apiResult.length > 0) {
      localStorage.setItem('lastPage', 'false')
    } else {
      localStorage.setItem('lastPage', 'true')
    }
    await DB.open();
    if (pageNo == 0) {
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
    } else {
      await DB.notes.bulkAdd(
        apiResult.map((r) => {
          return {
            id: r.id,
            text: r.text,
            created_at: new Date(r.CreatedAt).toISOString()
          };
        })
      );
      Note.list.push(...apiResult);
      localStorage.setItem('lastSync', +new Date());
    }

  } catch (error) {
    if (error.code && error.code == 401) {
      localStorage.clear();
      m.route.set('/login');
    }
    console.log(error)
    NoteList.error = 'Failed to load notes';
  }
  return apiResult;
}


var Note = {
  isLoading: false,
  shareCode: "",
  list: [],
  loadList: async function (getRemote, page) {
    let that = this;
    that.isLoading = true;
    m.redraw();
    if (getRemote) {
      await getRemoteList(page);
    } else if (+new Date() - localStorage.getItem('lastSync') > 360000 * 24) {
      //360000 * 24
      //sync if data older than 1 minute
      await getRemoteList(page);
    }
    that.isLoading = false;
    try {
      let notes = await DB.notes.orderBy('created_at').reverse().toArray();
      Note.list = notes;
      m.redraw();
      return notes;
    } catch (error) {
      return [];
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
          created_at: new Date(result.created_at).toISOString()
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
        console.log(e)
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
          created_at: new Date(result.created_at).toISOString()
        });
        that.isLoading = false;
        that.list[i] = {
          id: result.id,
          text: result.text,
          created_at: new Date(result.created_at).toISOString()
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
  share: function (shareCode) {
    let that = this;
    if (!shareCode.user_name) {
      NoteList.error = "please enter receiver username"
      return;
    }
    that.isLoading = true;
    return m
      .request({
        method: 'POST',
        url: API_URL + '/share-note',
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token')
        },
        responseType: "string",
        body: shareCode
      })
      .then(async function (result) {
        that.isLoading = false;
        NoteList.shareView = null;
      })
      .catch(function (e) {
        if (e.code == 401) {
          localStorage.clear();
          m.route.set('/login');
        }
        that.isLoading = false;
        NoteList.error = e.message;
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
    Note.loadList(false, this.page);
    NoteList.username = localStorage.getItem('username')
  },
  lastScrollTop: 0,
  page: 1,
  username: "",
  editing: null,
  shareView: null,
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
  showShare: function (note) {
    NoteList.shareView = {
      note_id: note.id,
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
        m('h1', ['ZotIt',
          m('span.welcome-text', "Hi " + ui.username)
        ]),
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
            {
              onscroll: async (e) => {
                let element = e.target;
                if (element.scrollTop < this.lastScrollTop) {
                  // upscroll 
                  return;
                }
                this.lastScrollTop = element.scrollTop <= 0 ? 0 : element.scrollTop;
                if (element.scrollTop + element.offsetHeight >= element.scrollHeight) {
                  this.page++;
                  if (localStorage.getItem('lastPage') == 'false') {
                    try {
                      await Note.loadList(true, this.page);
                    } catch (error) {
                      this.page--;
                    }
                  }
                }
              }
            },
            Note.list.map(function (note, i) {
              return m(
                'li.note-list-item',
                {
                  class: note === NoteList.editing ? 'editing' : NoteList.shareView && NoteList.shareView.note_id == note.id ? 'share-view' : ''
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
                          onclick: function (params) {
                            NoteList.showShare(note)
                          }
                        },
                        m('i.ion-share')
                      )
                    ]),
                    m('input.share-key-input', {

                      placeholder: 'Enter receiver Username',
                      maxlength: "60",
                      value: ui.shareView != null ? ui.shareView.user_name : "",
                      oninput: function (e) {
                        e.preventDefault();
                        ui.shareView.user_name = e.currentTarget.value;
                      },

                    }),
                    m('i.ion-checkmark.save-icon', {
                      onclick: function (e) {
                        Note.share(ui.shareView)

                      }
                    }),
                    m('i.ion-close.save-icon', {
                      onclick: function (e) {
                        NoteList.shareView = null
                        NoteList.error = ""
                      }
                    }),
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
        m(
          'button.refresh',
          {
            onclick: function () {
              Note.loadList(true, 0);
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
              DB.notes.clear();
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
