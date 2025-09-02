import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { Badge } from "./components/ui/badge";
import { FileUpload } from "./components/FileUpload";
import { Download, Info, Play, Loader2 } from "lucide-react";

export default function App() {
  const [jobName, setJobName] = useState("");
  const [mode, setMode] = useState("Antibody");
  const [frameworkFile, setFrameworkFile] =
    useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(
    null,
  );
  const [hotspots, setHotspots] = useState("A21, B14-21");
  const [rfDiffusionDesigns, setRfDiffusionDesigns] =
    useState("1");
  const [proteinMPNNDesigns, setProteinMPNNDesigns] =
    useState("1");
  const [designLoops, setDesignLoops] = useState(
    "H1_, H2.7, H3.5-13, L1.10-15, L2.10-15, L3.10-15",
  );
  const [isRunning, setIsRunning] = useState(false);

  // Generate default job name with current timestamp
  const generateDefaultJobName = () => {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
    return `RFantibody_${timestamp}`;
  };

  // Get effective job name (use input or generate default)
  const getEffectiveJobName = () => {
    return jobName.trim() || generateDefaultJobName();
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    return (
      frameworkFile !== null &&
      targetFile !== null &&
      hotspots.trim() !== "" &&
      parseInt(rfDiffusionDesigns) > 0 &&
      parseInt(proteinMPNNDesigns) > 0
    );
  };

  const handleRunJob = async () => {
    if (!isFormValid()) return;

    const effectiveJobName = getEffectiveJobName();
    
    setIsRunning(true);
    
    // Create job data object
    const jobData = {
      jobName: effectiveJobName,
      mode,
      frameworkFile: frameworkFile?.name,
      targetFile: targetFile?.name,
      hotspots,
      rfDiffusionDesigns: parseInt(rfDiffusionDesigns),
      proteinMPNNDesigns: parseInt(proteinMPNNDesigns),
      designLoops,
      createdAt: new Date().toISOString(),
      status: 'submitted'
    };

    console.log('Job Data:', jobData);
    
    // Simulate job processing
    setTimeout(() => {
      setIsRunning(false);
      alert(
        `Job "${effectiveJobName}" submitted successfully! You will be notified when the results are ready.`,
      );
    }, 2000);
  };

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto p-6 bg-background min-h-screen">
        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute top-0 right-0">
            <Badge variant="secondary" className="text-xs">
              v1.0.7
            </Badge>
          </div>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <h1 className="mb-2 text-4xl font-bold">
              Use RFantibody
            </h1>
          </div>
        </div>

        {/* Job Name Section */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              Job Information
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Provide a name or description for your job
                    to help you organize and track its results.
                    This input is solely for organizational
                    purposes and does not impact the outcome of
                    the job.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="jobName">
                Job Name / Description
              </Label>
              <Input
                id="jobName"
                placeholder={`Enter job name (default: ${generateDefaultJobName()})`}
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                className="w-full"
              />
              {!jobName.trim() && (
                <p className="text-xs text-muted-foreground">
                  Will use default name: <span className="font-mono">{generateDefaultJobName()}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuration & Options */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Service Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mode */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Mode
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select the mode of the design.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Antibody">
                    Antibody
                  </SelectItem>
                  <SelectItem value="Nanobody">
                    Nanobody
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Input Framework */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Input Framework
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Input framework template for the design.
                      The expected type (Antibody or Nanobody)
                      depends on the selected 'Mode'.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <FileUpload
                onFileSelect={setFrameworkFile}
                selectedFile={frameworkFile}
                label="Select Framework Structure"
              />
            </div>

            {/* Input Target */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Input Target
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Input target protein for the design.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <FileUpload
                onFileSelect={setTargetFile}
                selectedFile={targetFile}
                label="Select Target Structure"
              />
            </div>

            {/* Hotspots */}
            <div className="space-y-2">
              <Label
                htmlFor="hotspots"
                className="flex items-center gap-2"
              >
                Hotspots
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-sm">
                      Specify key residues on the target protein
                      to guide binding. Provide a
                      comma-separated list. Each item can be a
                      single residue (e.g., 'A21') or a range
                      (e.g., 'B14-21'). Uses 1-based numbering.
                      Designs focusing on hydrophobic residues
                      work best.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="hotspots"
                placeholder="e.g., A21, B14-21"
                value={hotspots}
                onChange={(e) => setHotspots(e.target.value)}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Design Parameters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Design Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Number of RFdiffusion Backbone Designs */}
            <div className="space-y-2">
              <Label
                htmlFor="rfDiffusion"
                className="flex items-center gap-2"
              >
                RFdiffusion Backbone Designs
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-sm">
                      Number of distinct backbone structures to
                      generate using RFdiffusion. The total
                      number of final designs will be this value
                      multiplied by the 'Number of ProteinMPNN
                      Designs'. Higher values increase runtime
                      and credit usage.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="rfDiffusion"
                type="number"
                min="1"
                value={rfDiffusionDesigns}
                onChange={(e) =>
                  setRfDiffusionDesigns(e.target.value)
                }
                className="w-full"
              />
            </div>

            {/* Number of ProteinMPNN Designs */}
            <div className="space-y-2">
              <Label
                htmlFor="proteinMPNN"
                className="flex items-center gap-2"
              >
                ProteinMPNN Designs
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-sm">
                      The number of ProteinMPNN sequences to
                      generate for each RFdiffusion backbone.
                      Higher values increase runtime and credit
                      usage.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="proteinMPNN"
                type="number"
                min="1"
                value={proteinMPNNDesigns}
                onChange={(e) =>
                  setProteinMPNNDesigns(e.target.value)
                }
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle>Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label
                htmlFor="designLoops"
                className="flex items-center gap-2"
              >
                Design Loops
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-md">
                      Specify which CDR loops (H1, H2, H3, L1,
                      L2, L3) to design and optionally constrain
                      their lengths. Each item follows the
                      format: 'LOOP', 'LOOP:LENGTH' or
                      'LOOP:START-END'. Examples: 'H1', 'L2:7',
                      'H3:5-13'. If omitted, loops remain fixed
                      from the input framework.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="designLoops"
                placeholder="e.g., H1, H2:7, H3:5-13, L1:10-15"
                value={designLoops}
                onChange={(e) => setDesignLoops(e.target.value)}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Section */}
        <Card
          className={`border-2 ${isFormValid() ? "border-primary/30 bg-primary/5" : "border-dashed border-muted-foreground/20"}`}
        >
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                  isFormValid() ? "bg-primary/20" : "bg-muted"
                }`}
              >
                {isRunning ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <Play
                    className={`w-8 h-8 ${isFormValid() ? "text-primary" : "text-muted-foreground"}`}
                  />
                )}
              </div>
              <div>
                <h3 className="mb-2">
                  {isFormValid()
                    ? "Ready to Run Job"
                    : "Complete Configuration"}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {isFormValid()
                    ? "All required fields are completed. Click below to start the protein design process."
                    : "Please fill in all required fields to proceed with the job."}
                </p>
                {!isFormValid() && (
                  <div className="mt-3 text-sm space-y-1">
                    <p className="text-destructive">
                      Missing required fields:
                    </p>
                    <ul className="text-muted-foreground space-y-1">
                      {!frameworkFile && (
                        <li>• Framework Structure</li>
                      )}
                      {!targetFile && (
                        <li>• Target Structure</li>
                      )}
                      {!hotspots.trim() && <li>• Hotspots</li>}
                    </ul>
                  </div>
                )}
              </div>
              <div className="pt-2">
                <Button
                  size="lg"
                  className="px-8"
                  disabled={!isFormValid() || isRunning}
                  onClick={handleRunJob}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running Job...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Job
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Developed by University of Seoul & KAIST</span>
        </div>
      </div>
    </TooltipProvider>
  );
}