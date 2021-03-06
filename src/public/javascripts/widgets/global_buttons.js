import BasicWidget from "./basic_widget.js";

const WIDGET_TPL = `
<div class="global-buttons">
    <style>
    .global-buttons {
        display: flex;
        justify-content: space-around;
        padding: 3px 0 3px 0;
        border: 1px solid var(--main-border-color);
        border-radius: 7px;
        margin: 3px 5px 5px 5px;
    }
    </style>

    <a data-trigger-command="createTopLevelNote"
       title="Create new top level note" 
       class="icon-action bx bx-folder-plus"></a>

    <a data-trigger-command="collapseTree"
       title="Collapse note tree" 
       data-command="collapseTree" 
       class="icon-action bx bx-layer-minus"></a>

    <a data-trigger-command="scrollToActiveNote"
       title="Scroll to active note" 
       data-command="scrollToActiveNote" 
       class="icon-action bx bx-crosshair"></a>

    <a data-trigger-command="searchNotes"
       title="Search in notes"
       data-command="searchNotes"
       class="icon-action bx bx-search"></a>
</div>
`;

class GlobalButtonsWidget extends BasicWidget {
    doRender() {
        return this.$widget = $(WIDGET_TPL);
    }
}

export default GlobalButtonsWidget;