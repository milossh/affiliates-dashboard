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
  var knownCategories = ['desktop', 'mobile', 'plugin', 'aurora', 'xp', 'recruit', 'thunderbird'];

  tableOutput = '<table><tr class="heading"><td></td>';
  for(i = 0; i <= knownCategories.length - 1; i++) {
    tableOutput += '<td>' + knownCategories[i] + '</td>';
  }
  tableOutput += '</tr>';
  function render() {
    for (var locale in locales) {
      var ids = [];
      var cats = [];
      var doneCats = {bugid:'', list:[]}; /* banner categories we have resolved bugs for */
      var openCats = {bugid:'', list:[]}; /* banner categories we have openeed bugs for */
      tableOutput += '<tr class="locale">' + 
        '<td><a href="https://bugzilla.mozilla.org/buglist.cgi?bug_id=' + 
        ids.join(',') + '">' + locale + '</a></td>'; 
      for (var i = 0; i < locales[locale].bugs.length; i++) {
        console.log(locales[locale].bugs[i].id);
        ids.push(locales[locale].bugs[i].id);
        /*
        cats = cats.concat(locales[locale].bugs[i].categories);
        cats = cats.join("`").toLowerCase().split("`"); */

        if (locales[locale].bugs[i].status == 'NEW' ||
            locales[locale].bugs[i].status == 'ASSIGNED') {
          console.log("open: " + locales[locale].bugs[i].categories);
          openCats.list = openCats.list.concat(locales[locale].bugs[i].categories);
          openCats = {  list: openCats.list.join("`").toLowerCase().split("`"),
                        bugid: locales[locale].bugs[i].id
                      };
        } else {
          console.log("done: " + locales[locale].bugs[i].categories);
          doneCats.list = doneCats.list.concat(locales[locale].bugs[i].categories);
          doneCats = {  list: doneCats.list.join("`").toLowerCase().split("`"),
                        bugid: locales[locale].bugs[i].id
                      };
        }  
      }
      for(j = 0; j <= knownCategories.length - 1; j++) {
        /*console.log($.inArray(knownCategories[i], cats)); */
        if ($.inArray(knownCategories[j], openCats.list) != -1) {
          tableOutput += '<td class="open"><a href="http://bugzilla.mozilla.org/show_bug.cgi?id=' + 
          openCats.bugid + '">' + openCats.bugid +'</td>';
        } else if($.inArray(knownCategories[j], doneCats.list) != -1) {
          tableOutput += '<td class="done"><a href="http://bugzilla.mozilla.org/show_bug.cgi?id=' + 
          doneCats.bugid + '">' + doneCats.bugid +'</td>';
        } else {
          tableOutput += '<td class="no"><a href="https://bugzilla.mozilla.org/enter_bug.cgi?product=Websites&component=affiliates.mozilla.org%20banners">file a bug</a></td>';
        }
      }
      tableOutput += '</tr>';
      console.log("locale: " + locale + "; open: " + openCats.list + "; closed: " + doneCats.list);
    }
    tableOutput += '</table>';
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
    meta.locale = params[0].toLowerCase();
    meta.categories = params.slice(1);
    /* testing
    console.log("params:" + params);
    console.log("locale: " + meta.locale + "; categories: " + meta.categories + "; summary: " + meta.summary);
    */
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
      /* console.log("just added to locale " + meta.locale + " a bug number " + bug.id); */
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
      product: 'Websites',
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