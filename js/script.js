/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is triage helper.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):  Milos Dinic <mdinic@mozilla.com>
 *                  Matjaz Horvat <mhorvat@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

$(function() {
 
  var locales = [];
  var knownCategories = ['mobile', 'desktop', 'snippets', 'aurora', 'beta', 'XP', '3.6', 'plugin', 'thunderbird'];

  tableOutput = '<table class="table table-bordered table-striped table-condensed"><thead><tr><th></th>';
  for(i = 0; i <= knownCategories.length - 1; i++) {
    tableOutput += '<th>' + knownCategories[i] + '</th>';
  }
  tableOutput += '</tr></thead><tbody>';
  function render() {
    for (var locale in locales) {
      var ids = [];
      var cats = [];
      var doneCats = []; /* banner categories we have resolved bugs for */
      var openCats = []; /* banner categories we have openeed bugs for */ 
      for (var i = 0; i < locales[locale].bugs.length; i++) {
        ids.push(locales[locale].bugs[i].id);
        if (locales[locale].bugs[i].status == 'NEW' ||
            locales[locale].bugs[i].status == 'ASSIGNED' ||
            locales[locale].bugs[i].status == 'REOPENED') {
          for(k=0; k<locales[locale].bugs[i].categories.length; k++) {
            cats.push(
              { id: locales[locale].bugs[i].id,
                category: locales[locale].bugs[i].categories[k].toLowerCase(),
                status: 'open'
               }
            );
          }
        } else {
          for(k=0; k<locales[locale].bugs[i].categories.length; k++) {
            cats.push(
              { id: locales[locale].bugs[i].id,
                category: locales[locale].bugs[i].categories[k].toLowerCase(),
                status: 'done'
               }
            );
          }
        }  
      }
      tableOutput += '<tr class="locale">' + 
        '<td><a href="https://bugzilla.mozilla.org/buglist.cgi?bug_id=' + 
        ids.join(',') + '">' + locale + '</a></td>';
      
      for (var l in knownCategories) {
        var set = false;
        for (var m in cats) {
          if(knownCategories[l] == cats[m].category && cats[m].status == 'open') {
            tableOutput += '<td class="open"><a class="btn btn-warning btn-mini" href="http://bugzilla.mozilla.org/show_bug.cgi?id=' + 
            cats[m].id + '">' + cats[m].id +'</td>';
            set = true;
          } else if(knownCategories[l] == cats[m].category && cats[m].status == 'done') {
            tableOutput += '<td class="done"><a class="btn btn-success btn-mini" href="http://bugzilla.mozilla.org/show_bug.cgi?id=' + 
            cats[m].id + '">'+ cats[m].id +'</td>';
            set = true;
          }
        }
        if (!set) {
          tableOutput += '<td class="no"><a class="btn btn-danger btn-mini" href="https://bugzilla.mozilla.org/enter_bug.cgi?product=Websites&component=affiliates.mozilla.org%20banners&short_desc=[' + locale + '][' + knownCategories[l] +'] Lay out ' + knownCategories[l] +' Affiliates buttons for ' + locale + '">file a bug</a></td>';
        }
      }
      tableOutput += '</tr>';
    }
    tableOutput += '</tbody></table>';
    $('.main-content').append(tableOutput);
  }

  /* Parses locales and categories from bug summary:
   * "[locale code][and][banner][categories] And some summary text left"
   */

  function parse(summary) {
    var meta = {};

    /*  We get something like:
          [sr][mobile][thunderbird] Please fix this bug ASAP"
        First we split it by whitespace, so that we get what we call
        parameters([sr][mobile][thunderbird]) and summary(Please fix this bug ASAP).
    */
    temp = summary.split(" ");
    parameters = temp[0];
    meta.summary = temp.slice(1).join(" "); /*  Take everything except first part
                                                and add whitespaces again, getting
                                                the summary we want.
                                            */
    var params = [];
    $.each(parameters.split("["), function(index, value) {
      var tempParams = this.split("]");  /* Split everything by "[" and "]" after,
                                            so that we get an array of parameters
                                            ie. ['sr', 'mobile', 'thunderbird'] 
                                          */
      for (var i = 0; i < tempParams.length; i++) {
        if (tempParams[i] == "") {        
          tempParams.splice(i, 1);        /*  Check if parameter has value, and remove it
                                              if it doesn't.
                                          */
          i--;
        }
      }
      if (tempParams.length >= 1){
          params.push(tempParams.join(""));
      }
    });
    console.log(params);
    console.log(summary);
    meta.locale = params[0].toLowerCase();
    meta.categories = params.slice(1);
    return meta;
  }

  function add(bug) {
    var meta = parse(bug.summary);
    if (meta.categories.length === 0) {
      meta.categories.push("none");
    }

    if (!locales[meta.locale]) {
      locales[meta.locale] = {name: meta.locale};
    }

    if (!locales[meta.locale].bugs) {
      locales[meta.locale].bugs = [];
      locales[meta.locale].bugs.push({ id:  bug.id,
                                            summary: meta.summary,
                                            categories: meta.categories,
                                            status: bug.status
                                        });
    } else {
      locales[meta.locale].bugs.push({ id:  bug.id,
                                            summary: meta.summary,
                                            categories: meta.categories,
                                            status: bug.status
                                        });
    }
  }

  $.ajax({ 

    /*  Define a URL for API
        Response contains the bug with all the properties
    */
    
    url: 'https://api-dev.bugzilla.mozilla.org/1.1/bug', 
    dataType: 'json',
    data: {
      product: 'Firefox Affiliates',
      component: 'affiliates.mozilla.org banners'
    }, 
    success: function(data) {
      /* if we get successful fetch call add() for each bug in response */
      $.each(data.bugs, function(index, value) {
        add(this);
      });
      render();
    }
  });
});