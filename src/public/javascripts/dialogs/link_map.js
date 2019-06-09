import server from '../services/server.js';
import noteDetailService from "../services/note_detail.js";
import libraryLoader from "../services/library_loader.js";
import treeCache from "../services/tree_cache.js";
import linkService from "../services/link.js";

const $linkMapContainer = $("#link-map-container");

const uniDirectionalOverlays = [
    [ "Arrow", {
        location: 1,
        id: "arrow",
        length: 14,
        foldback: 0.8
    } ],
    [ "Label", { label: "", id: "label", cssClass: "connection-label" }]
];

const linkOverlays = [
    [ "Arrow", {
        location: 1,
        id: "arrow",
        length: 14,
        foldback: 0.8
    } ]
];

const $dialog = $("#link-map-dialog");

let jsPlumbInstance = null;
let pzInstance = null;

async function showDialog() {
    glob.activeDialog = $dialog;

    await libraryLoader.requireLibrary(libraryLoader.LINK_MAP);

    jsPlumb.ready(() => {
        initJsPlumbInstance();

        initPanZoom();

        loadNotesAndRelations();
    });

    $dialog.modal();
}

async function loadNotesAndRelations() {
    const activeNoteId = noteDetailService.getActiveNoteId();

    const links = await server.get(`notes/${activeNoteId}/link-map`);

    const noteIds = new Set(links.map(l => l.noteId).concat(links.map(l => l.targetNoteId)));

    // preload all notes
    const notes = await treeCache.getNotes(Array.from(noteIds));

    const graph = new Springy.Graph();
    graph.addNodes(...noteIds);
    graph.addEdges(...links.map(l => [l.noteId, l.targetNoteId]));

    const layout = new Springy.Layout.ForceDirected(
        graph,
        400.0, // Spring stiffness
        400.0, // Node repulsion
        0.5 // Damping
    );

    function getNoteBox(noteId) {
        const noteBoxId = noteIdToId(noteId);
        const $existingNoteBox = $("#" + noteBoxId);

        if ($existingNoteBox.length > 0) {
            return $existingNoteBox;
        }

        const note = notes.find(n => n.noteId === noteId);

        const $noteBox = $("<div>")
            .addClass("note-box")
            .prop("id", noteBoxId);

        linkService.createNoteLink(noteId, note.title).then($link => {
            $noteBox.append($("<span>").addClass("title").append($link));
        });

        if (activeNoteId === noteId) {
            $noteBox.addClass("link-map-active-note");
        }

        jsPlumbInstance.getContainer().appendChild($noteBox[0]);

        jsPlumbInstance.draggable($noteBox[0], {
            start: params => {
                renderer.stop();
            },
            drag: params => {},
            stop: params => {}
        });


        return $noteBox;
    }

    const renderer = new Springy.Renderer(
        layout,
        () => {},
        (edge, p1, p2) => {
            const connectionId = edge.source.id + '-' + edge.target.id;

            if ($("#" + connectionId).length > 0) {
                return;
            }

            getNoteBox(edge.source.id);
            getNoteBox(edge.target.id);

            const connection = jsPlumbInstance.connect({
                source: noteIdToId(edge.source.id),
                target: noteIdToId(edge.target.id),
                type: 'link'
            });

            connection.canvas.id = connectionId;
        },
        (node, p) => {
            const $noteBox = getNoteBox(node.id);

            $noteBox
                .css("left", (300 + p.x * 100) + "px")
                .css("top", (300 + p.y * 100) + "px");
        },
        () => {},
        () => {},
        () => {
            jsPlumbInstance.repaintEverything();
        }
    );

    renderer.start();
}

function initPanZoom() {
    if (pzInstance) {
        return;
    }

    pzInstance = panzoom($linkMapContainer[0], {
        maxZoom: 2,
        minZoom: 0.3,
        smoothScroll: false,
        filterKey: function (e, dx, dy, dz) {
            // if ALT is pressed then panzoom should bubble the event up
            // this is to preserve ALT-LEFT, ALT-RIGHT navigation working
            return e.altKey;
        }
    });
}

function cleanup() {
    // delete all endpoints and connections
    // this is done at this point (after async operations) to reduce flicker to the minimum
    jsPlumbInstance.deleteEveryEndpoint();

    // without this we still end up with note boxes remaining in the canvas
    $linkMapContainer.empty();
}

function initJsPlumbInstance() {
    if (jsPlumbInstance) {
        cleanup();

        return;
    }

    jsPlumbInstance = jsPlumb.getInstance({
        Endpoint: ["Dot", {radius: 2}],
        ConnectionOverlays: uniDirectionalOverlays,
        HoverPaintStyle: { stroke: "#777", strokeWidth: 1 },
        Container: $linkMapContainer.attr("id")
    });

    jsPlumbInstance.registerConnectionType("link", { anchor: "Continuous", connector: "Straight", overlays: linkOverlays });
}

function noteIdToId(noteId) {
    return "link-map-note-" + noteId;
}

export default {
    showDialog
};