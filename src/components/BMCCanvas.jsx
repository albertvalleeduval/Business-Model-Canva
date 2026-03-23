import EditableBlock from './EditableBlock';

export default function BMCCanvas({ data, onDataChange }) {
    const updateBlock = (key, value) => {
        onDataChange({ ...data, [key]: value });
    };

    return (
        <div id="bmc-canvas" className="w-full max-w-[1400px] mx-auto bg-white p-8">
            {/* Business Model Canvas Title */}
            <h1 className="text-3xl font-bold text-center mb-6 text-slate-800">
                Business Model Canvas
            </h1>

            {/* Main Grid */}
            <div className="grid grid-cols-5 grid-rows-2 gap-0 border border-slate-300 bg-white"
                style={{ aspectRatio: '297/210', minHeight: '600px' }}>

                {/* Row 1 - Top Section */}
                {/* Column 1: Key Partners (Tall) */}
                <EditableBlock
                    title="Key Partners"
                    value={data.key_partners || ''}
                    onChange={(value) => updateBlock('key_partners', value)}
                    className="row-span-1"
                />

                {/* Column 2: Key Activities & Key Resources */}
                <div className="grid grid-rows-2 gap-0">
                    <EditableBlock
                        title="Key Activities"
                        value={data.key_activities || ''}
                        onChange={(value) => updateBlock('key_activities', value)}
                    />
                    <EditableBlock
                        title="Key Resources"
                        value={data.key_resources || ''}
                        onChange={(value) => updateBlock('key_resources', value)}
                    />
                </div>

                {/* Column 3: Value Propositions (Center Pillar, Tall) */}
                <EditableBlock
                    title="Value Propositions"
                    value={data.value_propositions || ''}
                    onChange={(value) => updateBlock('value_propositions', value)}
                    className="row-span-1 bg-slate-50"
                />

                {/* Column 4: Customer Relationships & Channels */}
                <div className="grid grid-rows-2 gap-0">
                    <EditableBlock
                        title="Customer Relationships"
                        value={data.customer_relationships || ''}
                        onChange={(value) => updateBlock('customer_relationships', value)}
                    />
                    <EditableBlock
                        title="Channels"
                        value={data.channels || ''}
                        onChange={(value) => updateBlock('channels', value)}
                    />
                </div>

                {/* Column 5: Customer Segments (Tall) */}
                <EditableBlock
                    title="Customer Segments"
                    value={data.customer_segments || ''}
                    onChange={(value) => updateBlock('customer_segments', value)}
                    className="row-span-1"
                />

                {/* Row 2 - Bottom Section */}
                <EditableBlock
                    title="Cost Structure"
                    value={data.cost_structure || ''}
                    onChange={(value) => updateBlock('cost_structure', value)}
                    className="col-span-2"
                />

                <EditableBlock
                    title="Revenue Streams"
                    value={data.revenue_streams || ''}
                    onChange={(value) => updateBlock('revenue_streams', value)}
                    className="col-span-3"
                />
            </div>
        </div>
    );
}
