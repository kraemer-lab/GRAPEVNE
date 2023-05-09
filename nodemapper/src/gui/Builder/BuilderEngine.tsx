import NodeMapEngine from 'NodeMap/scene/NodeMapEngine'
import { useAppDispatch } from 'redux/store/hooks'
import { builderNodeSelected } from 'redux/actions'
import { builderNodeDeselected } from 'redux/actions'

export default class BuilderEngine extends NodeMapEngine {
  // Set up a singleton instance of a class
  private static _Instance: BuilderEngine;

  public static get Instance(): BuilderEngine {
    return BuilderEngine._Instance || (this._Instance = new this());
  }
  
  public UpdateListeners() {
    const dispatch = useAppDispatch();
    const model = this.engine.getModel();
    model.getNodes().forEach(node =>
      node.registerListener({
        selectionChanged: (e) => {
          const payload = {
            id: node.options.id,
          }
          if (e.isSelected) {
            dispatch(builderNodeSelected(payload))
          }
          else {
            dispatch(builderNodeDeselected(payload))
          }
        }
      })
    );
  }
}
